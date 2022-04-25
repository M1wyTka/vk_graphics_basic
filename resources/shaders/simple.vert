#version 450
#extension GL_ARB_separate_shader_objects : enable
#extension GL_GOOGLE_include_directive : require

#include "unpack_attributes.h"
#include "common.h"

float height = 64.0f;
float width = 64.0f;

layout(location = 0) in vec4 vPosNorm;
layout(location = 1) in vec4 vTexCoordAndTang;

layout(push_constant) uniform params_t
{
    mat4 mProjView;
    mat4 mModel;
} params;

layout (location = 0) out VS_OUT
{
    vec3 wPos;
    vec3 wNorm;
    vec3 wTangent;
    vec2 texCoord;

} vOut;

layout(binding = 0, set = 0) uniform AppData
{
   UniformParams Params;
};

layout(binding = 1) uniform sampler2D diffuseTexture;

out gl_PerVertex { vec4 gl_Position; };
void main(void)
{
    // x = [0, width-1] y = [0, height-1]
    int iWidth = int(width);
    vec2 res = vec2((gl_VertexIndex % iWidth), (gl_VertexIndex / iWidth)); // x and z
    vec2 coord = vec2(res.x/width, res.y/height);

    vec3 wNorm = vec3(0.0f, 1.0f, 0.0f);
    vec2 dx = vec2(1.0f, 0.0f) / width;
    vec2 dy = vec2(0.0f, 1.0f) / height;

    if(res.x > 0.0f && res.x < width-1.0f && res.y > 0.0f && res.y < height-1){
        vec2 r = coord + dx;
        float R = texture(diffuseTexture, r).x;
    
        vec2 l = coord - dx;
        float L = texture(diffuseTexture, l).x;
    
        vec2 t = coord - dy;
        float T = texture(diffuseTexture, t).x;
    
        vec2 b = coord + dy;
        float B = texture(diffuseTexture, b).x;
        
        wNorm = normalize(vec3((R - L) / 2.0f , 1.0f, (B - T) / 2.0f));
    }
    //vec3 wNorm = vec3(0.0f, 1.0f, 0.0f);
    const vec4 wTang = vec4(DecodeNormal(floatBitsToInt(vTexCoordAndTang.z)), 0.0f);

    vOut.wPos     = vec3(res.x*Params.ampl.x                       + Params.offsetPos.x,
                    texture(diffuseTexture, coord).x*Params.ampl.y + Params.offsetPos.y,
                    res.y*Params.ampl.z                            + Params.offsetPos.z);
    vOut.wNorm    = wNorm; 
    vOut.wTangent = vec3(0.0f, 0.0f, 0.0f);
    vOut.texCoord = coord; 

    gl_Position   = params.mProjView * vec4(vOut.wPos, 1.0f);
}
