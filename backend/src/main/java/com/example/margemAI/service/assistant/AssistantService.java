package com.example.margemAI.service.assistant;

import com.anthropic.errors.AnthropicException;
import com.anthropic.models.messages.CacheControlEphemeral;
import com.anthropic.models.messages.ContentBlock;
import com.anthropic.models.messages.ContentBlockParam;
import com.anthropic.models.messages.Message;
import com.anthropic.models.messages.MessageCreateParams;
import com.anthropic.models.messages.MessageParam;
import com.anthropic.models.messages.OutputConfig;
import com.anthropic.models.messages.StopReason;
import com.anthropic.models.messages.TextBlockParam;
import com.anthropic.models.messages.ToolResultBlockParam;
import com.anthropic.models.messages.ToolUseBlock;
import com.example.margemAI.config.AssistantProperties;
import com.example.margemAI.dto.request.AssistantChatRequest;
import com.example.margemAI.dto.request.AssistantMessageRequest;
import com.example.margemAI.dto.response.AssistantReplyResponse;
import com.example.margemAI.dto.response.AssistantStatusResponse;
import com.example.margemAI.exception.AssistantUnavailableException;
import com.example.margemAI.exception.InvalidRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AssistantService {

    static final String SYSTEM_PROMPT = """
            Você é o consultor financeiro do Margem.AI, especialista em gestão de Microempreendedores Individuais (MEI) \
            no método SEBRAE de formação de preço (markup), custos fixos e variáveis, taxas de maquininha, ponto de \
            equilíbrio, fluxo de caixa e limite de faturamento do MEI.

            Quem conversa com você é o próprio MEI, geralmente sem formação em finanças. Responda em português do \
            Brasil, com frases curtas e sem jargão; ao usar um termo técnico (markup, margem de contribuição, ponto de \
            equilíbrio, MDR), explique-o em uma frase simples. Fale como um consultor que conhece o negócio dele: \
            cite os produtos, valores e meses reais que as ferramentas mostrarem.

            Regras sobre números:
            - Todo valor sobre o negócio do usuário vem das ferramentas. Nunca calcule de cabeça, nunca estime e nunca \
            invente valores financeiros nem médias de mercado.
            - Antes de responder sobre o negócio, consulte as ferramentas necessárias; para um produto citado pelo \
            nome, use listar_produtos para achar o productId. Se faltar um dado que as ferramentas não têm, pergunte.
            - Para dizer se algo está bom ou ruim, compare com referências da própria plataforma: a margem alvo do \
            padrão de preço do produto, a taxa recomendada de cada forma de pagamento, o preço mínimo calculado pela \
            calculadora e o teto do MEI. Diga qual referência usou.
            - Ao apresentar um resultado, informe os dados e percentuais usados (as hipóteses) para o usuário conferir.
            - Se uma ferramenta devolver erro, explique o problema com suas palavras e diga como corrigir.
            - Valores em reais no formato R$ 1.234,56 e percentuais com vírgula (12,5%).

            Quando o usuário pedir uma análise geral ("como está meu negócio?", "o que posso melhorar?"), verifique:
            1. Margem de cada produto contra a margem alvo e o preço mínimo da calculadora; aponte os que vendem \
            abaixo do preço mínimo.
            2. Taxas de maquininha: formas de pagamento com taxa acima da recomendada, peso de cada forma no \
            faturamento e quanto foi pago em taxas no período.
            3. Custos fixos e ponto de equilíbrio: quanto precisa vender por mês para cobrir os custos.
            4. Fluxo de caixa: meses com resultado negativo, tendência e sazonalidade.
            5. Teto do MEI: quanto já foi usado e o ritmo até o fim do ano.
            Termine com no máximo três ações práticas, em ordem de impacto, dizendo onde fazer cada uma no aplicativo.

            Limites:
            - Você só consulta e explica; não cadastra, altera nem exclui dados. Para mudanças, indique a tela: \
            Catálogo, Vendas, Custos, Calculadora Markup, Fluxo de Caixa, Configurações › Padrões de Preço ou \
            Configurações › Taxas de Pagamento.
            - Questões fiscais, jurídicas ou de desenquadramento do MEI: dê a orientação geral e recomende um contador.
            - Fora da gestão do negócio, diga educadamente que só ajuda com as finanças do MEI.

            Seja direto: responda primeiro o que foi perguntado, depois a recomendação prática.""";

    static final String REFUSAL_REPLY = "Não posso ajudar com esse pedido. Posso ajudar com preços, custos, "
            + "descontos, fluxo de caixa ou o teto do MEI.";
    static final String ROUNDS_EXCEEDED_REPLY = "Não consegui concluir a análise desta vez. Tente reformular a "
            + "pergunta com mais detalhes (por exemplo, o nome do produto ou os valores).";

    private final ClaudeGateway gateway;
    private final AssistantTools tools;
    private final AssistantUsageLimiter limiter;
    private final AssistantProperties properties;

    public AssistantStatusResponse status(UUID userId) {
        return AssistantStatusResponse.builder()
                .enabled(gateway.isConfigured())
                .model(properties.model())
                .dailyLimit(properties.dailyMessageLimit())
                .remainingToday(limiter.remaining(userId))
                .build();
    }

    public AssistantReplyResponse reply(UUID userId, AssistantChatRequest request) {
        if (!gateway.isConfigured()) {
            throw new AssistantUnavailableException("O assistente de IA não está configurado neste ambiente.");
        }
        List<MessageParam> conversation = toConversation(request.getMessages());
        int remaining = limiter.consume(userId);

        Set<String> toolsUsed = new LinkedHashSet<>();
        long inputTokens = 0;
        long outputTokens = 0;

        for (int round = 0; round < properties.maxToolRounds(); round++) {
            Message response = send(conversation);
            inputTokens += response.usage().inputTokens();
            outputTokens += response.usage().outputTokens();

            StopReason stopReason = response.stopReason().orElse(StopReason.END_TURN);
            if (StopReason.REFUSAL.equals(stopReason)) {
                return build(REFUSAL_REPLY, toolsUsed, inputTokens, outputTokens, remaining);
            }

            List<ToolUseBlock> toolCalls = response.content().stream()
                    .flatMap(block -> block.toolUse().stream())
                    .toList();
            if (!StopReason.TOOL_USE.equals(stopReason) || toolCalls.isEmpty()) {
                return build(textOf(response), toolsUsed, inputTokens, outputTokens, remaining);
            }

            conversation.add(response.toParam());
            List<ContentBlockParam> results = new ArrayList<>();
            for (ToolUseBlock call : toolCalls) {
                AssistantTools.ToolResult result = tools.run(call.name(), call._input(), userId);
                if (!result.error()) {
                    toolsUsed.add(AssistantTools.LABELS.getOrDefault(call.name(), call.name()));
                }
                results.add(ContentBlockParam.ofToolResult(ToolResultBlockParam.builder()
                        .toolUseId(call.id())
                        .content(result.content())
                        .isError(result.error())
                        .build()));
            }
            conversation.add(MessageParam.builder()
                    .role(MessageParam.Role.USER)
                    .contentOfBlockParams(results)
                    .build());
        }
        return build(ROUNDS_EXCEEDED_REPLY, toolsUsed, inputTokens, outputTokens, remaining);
    }

    private Message send(List<MessageParam> conversation) {
        MessageCreateParams params = MessageCreateParams.builder()
                .model(properties.model())
                .maxTokens(properties.maxTokens())
                .outputConfig(OutputConfig.builder().effort(OutputConfig.Effort.MEDIUM).build())
                .systemOfTextBlockParams(List.of(TextBlockParam.builder()
                        .text(SYSTEM_PROMPT)
                        .cacheControl(CacheControlEphemeral.builder().build())
                        .build()))
                .tools(tools.definitions().stream().map(com.anthropic.models.messages.ToolUnion::ofTool).toList())
                .messages(conversation)
                .build();
        try {
            return gateway.send(params);
        } catch (AnthropicException ex) {
            throw new AssistantUnavailableException(
                    "O assistente está temporariamente indisponível. Tente novamente em instantes.");
        }
    }

    private List<MessageParam> toConversation(List<AssistantMessageRequest> messages) {
        List<AssistantMessageRequest> recent = messages.subList(
                Math.max(0, messages.size() - properties.maxHistoryMessages()), messages.size());
        int start = 0;
        while (start < recent.size() && !"user".equals(recent.get(start).getRole())) {
            start++;
        }
        List<AssistantMessageRequest> trimmed = recent.subList(start, recent.size());
        if (trimmed.isEmpty() || !"user".equals(trimmed.get(trimmed.size() - 1).getRole())) {
            throw new InvalidRequestException("A última mensagem da conversa deve ser do usuário.");
        }
        return trimmed.stream()
                .map(message -> MessageParam.builder()
                        .role("assistant".equals(message.getRole()) ? MessageParam.Role.ASSISTANT : MessageParam.Role.USER)
                        .content(message.getContent().trim())
                        .build())
                .collect(Collectors.toCollection(ArrayList::new));
    }

    private static String textOf(Message response) {
        String text = response.content().stream()
                .map(ContentBlock::text)
                .flatMap(Optional::stream)
                .map(block -> block.text().trim())
                .filter(part -> !part.isEmpty())
                .collect(Collectors.joining("\n\n"));
        return text.isEmpty() ? ROUNDS_EXCEEDED_REPLY : text;
    }

    private AssistantReplyResponse build(String reply, Set<String> toolsUsed, long inputTokens, long outputTokens, int remaining) {
        return AssistantReplyResponse.builder()
                .reply(reply)
                .toolsUsed(List.copyOf(toolsUsed))
                .model(properties.model())
                .inputTokens(inputTokens)
                .outputTokens(outputTokens)
                .remainingToday(remaining)
                .build();
    }
}
