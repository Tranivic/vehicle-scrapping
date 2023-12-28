exports.generate_random_number = (start, end) => {
  if (start >= end) {
    throw new Error("Start number must be less than end number in generate number util.");
  }
  return Math.floor(Math.random() * (end - start + 1)) + start;
};