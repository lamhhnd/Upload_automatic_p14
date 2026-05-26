
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

class AIService {
  // Lấy key từ môi trường
  private geminiKey = process.env.REACT_APP_GEMINI_API_KEY || '';
  
  // Quay lại model 3.5 Flash
  private geminiUrl = "https://generativelanguage.googleapis.com/v1/models/gemini-3.5-flash:generateContent";

  async getResponse(messages: ChatMessage[]): Promise<string> {
    try {
      // Đảm bảo lịch sử chat bắt đầu bằng 'user' để tránh lỗi API
      let chatHistory = [...messages];
      while (chatHistory.length > 0 && chatHistory[0].role !== 'user') {
        chatHistory.shift();
      }

      // Chuyển đổi lịch sử sang định dạng Gemini
      const contents = chatHistory.map((msg, index) => {
        let text = msg.content;
        
        // Nhúng hướng dẫn vào tin nhắn đầu tiên của user để AI luôn nhớ vai trò
        if (index === 0) {
          text = `[INSTRUCTIONS: You are a professional IELTS tutor. Help the user learn vocabulary, correct grammar, and practice English. Respond in the language the user uses.]\n\nUser: ${text}`;
        }

        return {
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: text }]
        };
      });

      const response = await fetch(`${this.geminiUrl}?key=${this.geminiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: contents,
          generationConfig: {
            maxOutputTokens: 4000,
            temperature: 0.8,
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Gemini API Error');
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error: any) {
      console.error('Gemini Error:', error);
      return `Lỗi kết nối AI: ${error.message}. Vui lòng thử lại sau.`;
    }
  }
}

export const aiService = new AIService();
