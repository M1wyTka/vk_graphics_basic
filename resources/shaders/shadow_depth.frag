#version 450
#extension GL_ARB_separate_shader_objects : enable
#extension GL_GOOGLE_include_directive : require

#include "common.h"

layout(location = 0) out vec2 out_fragColor;
layout (binding = 0) uniform sampler2D shadowMap;

layout(push_constant) uniform params_t
{
    uint width;
    uint height;
    bool isVSM;
} params;

void main()
{
    int r = 5;
    uint div = (2*r+1)*(2*r+1);

    vec2 resolution = vec2(params.width, params.height);
    vec2 uv = gl_FragCoord.xy / resolution;

    if (!params.isVSM) {
        float d = textureLod(shadowMap, uv, 0).x;
        out_fragColor = vec2(d, 0.f);
        return;
    }

    // Adding blur
    float sum = 0;
    float sqsum = 0;

    for (int i = -r; i <= r; i++) {
        for (int j = -r; j <= r; j++) {
            vec2 coords = uv + vec2(i, j) / resolution;
            float t = textureLod(shadowMap, coords, 0).x;
            sum += t;
            sqsum += t*t;
        }
    }
    out_fragColor = vec2(sum, sqsum) / div;
}