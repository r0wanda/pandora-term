class Screen {
    cols;
    rows;
    constructor() {
        this.cols = process.stdout.columns;
        this.rows = process.stdout.rows;
        this.pH = this.rows / 100;
        this.pW = this.cols / 100;
    }
    wPer(per) {
        return Math.round(this.pW * per);
    }
    hPer(per) {
        return Math.round(this.pW * per);
    }
}

export default Screen;