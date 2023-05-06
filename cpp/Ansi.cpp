#include <string>
#include <vector>
#include <cstdio>
#include <sstream>
#include <iostream>
#include <unistd.h>
#include <sys/ioctl.h>
#include <opencv2/opencv.hpp>

using namespace std;

array<string, 10> chars =  {" ", ".", ":", "!", "+", "*", "e", "$", "@", "#"};

typedef array<int, 3> pixel;

int lumin(pixel px) {
	int r = px[0];
	int g = px[1];
	int b = px[2];
	int l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
	return l;
}

string getChar(pixel px) {
	int l = lumin(px);
	string c = l <= 25 ? chars[0] :
	l <= 51 && l > 25 ? chars[1] :
	l <= 76 && l > 51 ? chars[2] :
	l <= 102 && l > 76 ? chars[3] :
	l <= 127 && l > 102 ? chars[4] :
	l <= 153 && l > 127 ? chars[5] :
	l <= 178 && l > 153 ? chars[6] :
	l <= 204 && l > 153 ? chars[7] :
	l <= 229 && l > 204 ? chars[8] :
	l <= 255 && l > 229 ? chars[9] : chars[9];
	return c;
}
string procPixel(pixel px) {
	ostringstream res;
	string c = getChar(px);
	res << "\033[38;2;" << px[0] << ";" << px[1] << ";" << px[2] << "m" << c;
	return res.str();
}

string proc(string path, int w, int h) {
	string ansi = "";
	cv::Mat orig = cv::imread(path);
	cv::Mat img;
	cv::resize(orig, img, cv::Size(w, h), cv::INTER_LINEAR);
	for (int y = 0; y < img.rows; y++) {
		for (int x = 0; x < img.cols; x++) {
			auto matpx = img.at<cv::Vec3b>(y, x);
			pixel px = {matpx[2], matpx[1], matpx[0]};
			ansi += procPixel(px);
		}
		ansi += "\n";
	}
	ansi += "\033[0m";
	return ansi;
}

int main(int argc, char** argv) {
	if (argc < 2) {
		cerr << "Ansi needs one argument" << endl;
		return 1;
	} else {
		int w = argc > 2 ? stoi(argv[2]) : -1;
		int h = argc > 3 ? stoi(argv[3]) : -1;
		cout << proc(argv[1], w, h);
		return 0;
	}
}

