#include <stdio.h>
#include <iostream>
#include <string>
#include <vector>
#include <fstream>

using namespace std;

string parseFile(string fname) {
    std::ifstream input("file.txt");
    std::stringstream sstr;

    while (input >> sstr.rdbuf())
        ;

    std::cout << sstr.str() << std::endl;

    return "";
}
