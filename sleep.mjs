/**
 * Simple function that resolves after a certain amount of time
 * @param {number} t Timeout in milliseconds
 * @returns {Promise<void>}
 */
export default t => new Promise(r => setTimeout(t, r));