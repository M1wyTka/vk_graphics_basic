#version 450
#extension GL_GOOGLE_include_directive : require

#include "common.h"

layout (binding = 0) uniform sampler2D samplerPosition;
layout (binding = 1) uniform sampler2D samplerNormal;
layout (binding = 2) uniform sampler2D samplerAlbedo;

layout(push_constant) uniform params_t
{
    mat4 mProjView;
    vec4 lightPos;
    vec2 screenSize; 
    float lightRadius;
} params;

layout (location = 0) in vec2 inUV;

layout (location = 0) out vec4 outFragcolor;

void main() 
{
    vec2 uv = gl_FragCoord.xy / params.screenSize;
    vec3 fragPos = texture(samplerPosition, uv).rgb;
	vec3 normal  = texture(samplerNormal, uv).rgb;
	vec4 albedo  = texture(samplerAlbedo, uv);
    
    float lightDist = distance(params.lightPos.xyz, fragPos);
    vec3 lightDir   = normalize(params.lightPos.xyz - fragPos);
    
    if (lightDist > params.lightRadius) {
        outFragcolor = vec4(0.0f);
        return;
    }

    const vec4 dark_violet = vec4(0.59f, 0.0f, 0.82f, 1.0f);
    const vec4 chartreuse  = vec4(0.5f, 1.0f, 0.0f, 1.0f);

    vec4 weightedColor = mix(dark_violet, chartreuse, 0.5f);

    vec4 lightColor = max(dot(normal, lightDir), 0.0f) * weightedColor;
    outFragcolor = lightColor * albedo;
} 