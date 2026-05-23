export interface UnsplashImage {
  id: string;
  urls: {
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description: string;
  user: {
    name: string;
    links: {
      html: string;
    };
  };
}

/**
 * Sử dụng Wikipedia/Wikimedia Commons API.
 * Ưu điểm: Hoàn toàn miễn phí, KHÔNG CẦN KEY, ảnh cực kỳ chuẩn xác cho học tập.
 */
export const searchImages = async (query: string): Promise<UnsplashImage[]> => {
  try {
    // Wikipedia API tìm kiếm các trang liên quan và lấy hình ảnh đại diện (thumbnail)
    const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&generator=search&gsrsearch=${encodeURIComponent(
      query
    )}&gsrlimit=8&piprop=thumbnail&pithumbsize=400&origin=*`;

    const response = await fetch(url);
    if (!response.ok) throw new Error('Không thể kết nối với Wikipedia');

    const data = await response.json();
    
    if (!data.query || !data.query.pages) {
      return [];
    }

    const pages = data.query.pages;
    const results: UnsplashImage[] = [];

    Object.keys(pages).forEach((key) => {
      const page = pages[key];
      if (page.thumbnail) {
        results.push({
          id: page.pageid.toString(),
          urls: {
            regular: page.thumbnail.source,
            small: page.thumbnail.source,
            thumb: page.thumbnail.source,
          },
          alt_description: page.title,
          user: {
            name: 'Wikipedia',
            links: {
              html: `https://en.wikipedia.org/?curid=${page.pageid}`,
            },
          },
        });
      }
    });

    return results;
  } catch (error) {
    console.error('Lỗi tìm kiếm ảnh Wikipedia:', error);
    return [];
  }
};
