#version 450

layout(location = 0) in vec4 vPosNorm;
layout(location = 1) in vec4 vTexCoordAndTang;

layout(push_constant) uniform params_t
{
    mat4 mProjView;
    vec4 lightPos;
    vec2 screenSize; 
    float lightRadius;
} params;

layout (location = 0) out vec2 outUV;

void main() 
{
    vec3 pos = vPosNorm.xyz * params.lightRadius + params.lightPos.xyz;
    gl_Position   = params.mProjView * vec4(pos, 1.0);
}