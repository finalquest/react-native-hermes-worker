cmake_minimum_required(VERSION 3.4.1)
project(HermesWorker)

set (CMAKE_VERBOSE_MAKEFILE ON)
set (CMAKE_CXX_STANDARD 14)

add_library(react-native-hermes-worker            SHARED
            ../cpp/react-native-hermes-worker.cpp
            cpp-adapter.cpp
)

# Specifies a path to native header files.
include_directories(
            ../cpp
)
