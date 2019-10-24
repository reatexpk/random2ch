export async function asyncForEach<T>(
  array: T[],
  callback: (elem: T, index: number, array: T[]) => void,
) {
  for (let index = 0; index < array.length; ) {
    // eslint-disable-next-line no-await-in-loop
    await callback(array[index], index, array);
    index += 1;
  }
}

export function sleep(delay: number) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, delay);
  });
}
