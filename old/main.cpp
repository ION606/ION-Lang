#include "parser.cpp"


int main(int argc, char **argv) {
    if (argc < 2) throw std::invalid_argument("INSUFFICIENT COMAND LINE ARGS");
    parseFile(argv[1]);
}