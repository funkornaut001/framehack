export function cutWire(step) {
  // Generate a random number between 0 and 1
  const randomNumber = Math.random();
  let isSafe = false;

  // Determine if the user is a winner
  if (step === 1) {
    isSafe = randomNumber < 0.75;
  }
  if (step === 2) {
    isSafe = randomNumber < 0.66;
  }
  if (step === 3) {
    isSafe = randomNumber < 0.5;
  }

  // Return the result
  return isSafe;
}
