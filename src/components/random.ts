import { Vocab } from "../context/VocabContext";

export const randomIndex = (
  length: number,
  current: number
) => {
  if (length <= 1) return 0;
  let newIndex = current;

  while (newIndex === current) {
    newIndex = Math.floor(
      Math.random() * length
    );
  }

  return newIndex;
};

/**
 * Lấy index ngẫu nhiên nhưng ưu tiên:
 * 1. Những từ chưa học (lastSeen chưa có)
 * 2. Những từ đã lâu chưa học (lastSeen cũ nhất)
 * 3. Những từ có tỉ lệ đúng thấp
 */
export const getSmartRandomIndex = (
  list: Vocab[],
  currentIndex: number
) => {
  if (list.length <= 1) return 0;

  // Tạo một bản sao danh sách kèm theo index gốc
  const scoredList = list.map((vocab, index) => {
    let score = 0;

    // Ưu tiên từ chưa bao giờ thấy
    if (!vocab.lastSeen) {
      score += 10000;
    } else {
      // Ưu tiên từ đã lâu chưa thấy (tính theo ms)
      const lastSeenTime = new Date(vocab.lastSeen).getTime();
      const now = new Date().getTime();
      const hoursSinceSeen = (now - lastSeenTime) / (1000 * 60 * 60);
      score += hoursSinceSeen * 10; // Càng lâu chưa thấy càng cộng nhiều điểm
    }

    // Ưu tiên từ sai nhiều hơn đúng
    const correct = vocab.correctCount || 0;
    const wrong = vocab.wrongCount || 0;
    score += (wrong - correct) * 5;

    // Không chọn chính từ hiện tại
    if (index === currentIndex) {
      score = -1000000;
    }

    // Thêm một chút ngẫu nhiên để không bị lặp lại thứ tự cố định
    score += Math.random() * 50;

    return { index, score };
  });

  // Sắp xếp theo score giảm dần
  scoredList.sort((a, b) => b.score - a.score);

  // Lấy một trong 3 từ có điểm cao nhất để tăng tính ngẫu nhiên
  const topCount = Math.min(3, scoredList.length);
  const pickedIdx = Math.floor(Math.random() * topCount);
  
  return scoredList[pickedIdx].index;
};
