# CMakeLists.txt for AeroDisplay Cross-Platform Native Modules
# Supports MSVC on Windows (Host engine) and Android NDK (Client rendering engine)

cmake_minimum_required(VERSION 3.15)
project(AeroDisplayNative VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Configure output directories for compiled binaries
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin)
set(CMAKE_LIBRARY_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/lib)

# Setup conditional compiling depending on the target platform
if(WIN32)
    add_compile_definitions(UNICODE _UNICODE WIN32_LEAN_AND_MEAN)
    
    # Locate essential Windows SDK platform libraries
    link_libraries(
        ws2_32
        d3d11
        dxgi
        user32
        gdi32
        ole32
        oleaut32
    )
    
    # 1. AeroDisplay Host Server daemon
    add_executable(AeroDisplayHost
        host/Benchmark.cpp
        host/D3D11Capture.cpp
        host/WindowsGraphicsCapture.cpp
        host/GpuEncoder.cpp
        host/RtpPacketizer.cpp
        host/UdpTransport.cpp
        host/UsbTransport.cpp
        host/InputDeviceControl.cpp
        host/AudioCapture.cpp
        host/MonitorArrangement.cpp
    )
    
    target_include_directories(AeroDisplayHost PRIVATE 
        ${CMAKE_CURRENT_SOURCE_DIR}/driver
        ${CMAKE_CURRENT_SOURCE_DIR}/host
    )
    
elseif(ANDROID)
    # Android GLES Rendering Client Client build configuration
    find_library(GLES3_LIBRARY GLESv3)
    find_library(LOG_LIBRARY log)
    find_library(EGL_LIBRARY EGL)

    add_library(AeroDisplayClient SHARED
        client/GpuRenderer.cpp
    )

    target_link_libraries(AeroDisplayClient PRIVATE
        ${GLES3_LIBRARY}
        ${EGL_LIBRARY}
        ${LOG_LIBRARY}
    )

    target_include_directories(AeroDisplayClient PRIVATE 
        ${CMAKE_CURRENT_SOURCE_DIR}/client
    )
endif()
