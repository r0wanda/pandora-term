import _ora from 'ora';

export default (text, color = 'cyan') => _ora({
    text,
    color,
    spinner: 'bouncingBall'
}).start();