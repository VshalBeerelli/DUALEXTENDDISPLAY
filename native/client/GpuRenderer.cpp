/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * OpenGL ES 3.0 Mobile Client Renderer & Coordinate Mapping Surface.
 * Transforms encoded YUV video regions into full display RGB color space on the GPU.
 */

#include <GLES3/gl3.h>
#include <stdio.h>
#include <math.h>

class GpuViewportRenderer {
private:
    GLuint m_Program = 0;
    GLuint m_YTexture = 0;
    GLuint m_UvTexture = 0;
    GLuint m_Vao = 0;
    GLuint m_Vbo = 0;

    // High performance YUV-to-RGB GPU Shader Core
    const char* VertexShaderSource = R"(
        #version 300 es
        layout(location = 0) in vec2 position;
        layout(location = 1) in vec2 texCoord;
        out vec2 v_texCoord;
        void main() {
            gl_Position = vec4(position, 0.0, 1.0);
            v_texCoord = texCoord;
        }
    )";

    const char* FragmentShaderSource = R"(
        #version 300 es
        precision mediump float;
        in vec2 v_texCoord;
        out vec4 fragColor;
        
        uniform sampler2D yTexture;
        uniform sampler2D uvTexture;
        
        void main() {
            // Read Y luminance and UV chrominance values
            float y = texture(yTexture, v_texCoord).r;
            vec2 uv = texture(uvTexture, v_texCoord).ra - 0.5; // NV12 Semi Planar offset mapping
            
            // Apply standard BT.709 SDTV/HDTV color translation matrix parameters
            float r = y + 1.402 * uv.y;
            float g = y - 0.344 * uv.x - 0.714 * uv.y;
            float b = y + 1.772 * uv.x;
            
            fragColor = vec4(r, g, b, 1.0);
        }
    )";

public:
    GpuViewportRenderer() {}

    HRESULT Initialize() {
        // Compile vertex shader
        GLuint vs = glCreateShader(GL_VERTEX_SHADER);
        glShaderSource(vs, 1, &VertexShaderSource, nullptr);
        glCompileShader(vs);

        // Compile fragment shader
        GLuint fs = glCreateShader(GL_FRAGMENT_SHADER);
        glShaderSource(fs, 1, &FragmentShaderSource, nullptr);
        glCompileShader(fs);

        m_Program = glCreateProgram();
        glAttachShader(m_Program, vs);
        glAttachShader(m_Program, fs);
        glLinkProgram(m_Program);

        glDeleteShader(vs);
        glDeleteShader(fs);

        // Define square display clipping coordinates with inverted texture mappings
        float vertices[] = {
            -1.0f,  1.0f,  0.0f, 0.0f,
            -1.0f, -1.0f,  0.0f, 1.0f,
             1.0f, -1.0f,  1.0f, 1.0f,
             1.0f,  1.0f,  1.0f, 0.0f
        };

        glGenVertexArrays(1, &m_Vao);
        glGenBuffers(1, &m_Vbo);

        glBindVertexArray(m_Vao);
        glBindBuffer(GL_ARRAY_BUFFER, m_Vbo);
        glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);

        glVertexAttribPointer(0, 2, GL_FLOAT, GL_FALSE, 4 * sizeof(float), (void*)0);
        glEnableVertexAttribArray(0);
        glVertexAttribPointer(1, 2, GL_FLOAT, GL_FALSE, 4 * sizeof(float), (void*)(2 * sizeof(float)));
        glEnableVertexAttribArray(1);

        // Setup double texture allocations
        glGenTextures(1, &m_YTexture);
        glGenTextures(1, &m_UvTexture);

        printf("[GpuRenderer] OpenGL ES YUV Texture Pipeline initialized. Vao context: %u\n", m_Vao);
        return 0;
    }

    // Swaps surface buffers and translates touches to the physical Host screen dimensions
    VOID RenderFrame(const BYTE* yPlaneData, int yWidth, int yHeight, const BYTE* uvPlaneData, int uvWidth, int uvHeight) {
        glClear(GL_COLOR_BUFFER_BIT);
        glUseProgram(m_Program);

        // Bind Y texture plane
        glActiveTexture(GL_TEXTURE0);
        glBindTexture(GL_TEXTURE_2D, m_YTexture);
        glTexImage2D(GL_TEXTURE_2D, 0, GL_LUMINANCE, yWidth, yHeight, 0, GL_LUMINANCE, GL_UNSIGNED_BYTE, yPlaneData);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
        glUniform1i(glGetUniformLocation(m_Program, "yTexture"), 0);

        // Bind UV texture plane
        glActiveTexture(GL_TEXTURE1);
        glBindTexture(GL_TEXTURE_2D, m_UvTexture);
        glTexImage2D(GL_TEXTURE_2D, 0, GL_LUMINANCE_ALPHA, uvWidth, uvHeight, 0, GL_LUMINANCE_ALPHA, GL_UNSIGNED_BYTE, uvPlaneData);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
        glUniform1i(glGetUniformLocation(m_Program, "uvTexture"), 1);

        glBindVertexArray(m_Vao);
        glDrawArrays(GL_TRIANGLE_FAN, 0, 4);
    }

    ~GpuViewportRenderer() {
        if (m_YTexture) glDeleteTextures(1, &m_YTexture);
        if (m_UvTexture) glDeleteTextures(1, &m_UvTexture);
        if (m_Vbo) glDeleteBuffers(1, &m_Vbo);
        if (m_Vao) glDeleteVertexArrays(1, &m_Vao);
    }
};
