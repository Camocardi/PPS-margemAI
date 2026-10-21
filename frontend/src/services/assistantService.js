import api from './api'

export const assistantService = {
  async getStatus() {
    const response = await api.get('/assistant/status')
    return response.data
  },

  async sendMessage(messages) {
    const response = await api.post('/assistant/messages', { messages })
    return response.data
  }
}

export default assistantService
