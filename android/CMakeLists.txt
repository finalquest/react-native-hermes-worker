cmake_minimum_required(VERSION 3.22.1)
project(HermesWorker)

set (CMAKE_VERBOSE_MAKEFILE ON)
set (CMAKE_CXX_STANDARD 17)

if(${CMAKE_BUILD_TYPE} STREQUAL "Debug")
  string(APPEND CMAKE_CXX_FLAGS " -DDEBUG")
endif()

set(PACKAGE_NAME "HermesWorker")

# Pre-set Folly flags from React Native core
include("${REACT_NATIVE_DIR}/ReactAndroid/cmake-utils/folly-flags.cmake")
add_compile_options(${folly_FLAGS})

# Consume shared libraries and headers from prefabs
find_package(fbjni REQUIRED CONFIG)
find_package(ReactAndroid REQUIRED CONFIG)

file(GLOB_RECURSE SOURCES_COMMON CONFIGURE_DEPENDS "../cpp/**.cpp")

add_library(
  ${PACKAGE_NAME}
  SHARED
  ${SOURCES_COMMON}
  cpp-adapter.cpp
)

# includes
target_include_directories(
  ${PACKAGE_NAME}
  PRIVATE
  ../cpp
  ../cpp/base
  ../cpp/decorators
  ../cpp/dispatch
  ../cpp/sharedvalues
  ../cpp/wrappers
  "${REACT_NATIVE_DIR}/ReactAndroid/src/main/jni/react/turbomodule"
  "${REACT_NATIVE_DIR}/ReactCommon"
  "${REACT_NATIVE_DIR}/ReactCommon/callinvoker"
  "${REACT_NATIVE_DIR}/ReactCommon/runtimeexecutor"
)

# build shared lib
set_target_properties(${PACKAGE_NAME} PROPERTIES LINKER_LANGUAGE CXX)

# Ensure the shared object is linked with the 16 KB page alignment
# required for new Android devices while keeping 4 KB compatibility.
target_link_options(${PACKAGE_NAME} PRIVATE
        "-Wl,-z,common-page-size=4096"
        "-Wl,-z,max-page-size=16384")

target_link_libraries(
  ${PACKAGE_NAME}
  log
  android
)

target_link_libraries(
  ${PACKAGE_NAME}
  ReactAndroid::jsi
)

if(ReactAndroid_VERSION_MINOR GREATER_EQUAL 76)
  target_link_libraries(
    ${PACKAGE_NAME}
    ReactAndroid::reactnative             # <-- RN: Native Modules umbrella prefab
  )
else()
  target_link_libraries(
    ${PACKAGE_NAME}
    ReactAndroid::folly_runtime
    ReactAndroid::glog
  )
endif()

find_package(hermes-engine REQUIRED CONFIG)

string(APPEND CMAKE_CXX_FLAGS " -DJS_RUNTIME_HERMES=1")

if(TARGET hermes-engine::hermesvm)
  target_link_libraries(
    ${PACKAGE_NAME}
    hermes-engine::hermesvm
  )
elseif(TARGET hermes-engine::libhermes)
  target_link_libraries(
    ${PACKAGE_NAME}
    hermes-engine::libhermes
  )
elseif(TARGET hermes-engine::hermes)
  target_link_libraries(
    ${PACKAGE_NAME}
    hermes-engine::hermes
  )
else()
  message(FATAL_ERROR "react-native-hermes-worker: no Hermes engine target found")
endif()

  if(${HERMES_ENABLE_DEBUGGER})
    if(ReactAndroid_VERSION_MINOR GREATER_EQUAL 76)
      target_link_libraries(
        ${PACKAGE_NAME}
        ReactAndroid::hermestooling
      )
    else()
      target_link_libraries(
        ${PACKAGE_NAME}
        ReactAndroid::hermes_executor
      )
    endif()
  endif()