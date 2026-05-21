export const randomIndex = (
  length: number,
  current: number
) => {
  let newIndex = current;

  while (newIndex === current) {
    newIndex = Math.floor(
      Math.random() * length
    );
  }

  return newIndex;
};