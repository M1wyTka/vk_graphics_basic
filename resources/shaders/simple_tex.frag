#version 450
#extension GL_ARB_separate_shader_objects : enable
#extension GL_GOOGLE_include_directive : require

#include "common.h"

float height = 64.0f;
float width = 64.0f;

layout(location = 0) out vec4 out_fragColor;

layout(push_constant) uniform params_t
{
    mat4 mProjView;
    mat4 mModel;
} params;

layout (location = 0) in VS_OUT
{
    vec3 wPos;
    vec3 wNorm;
    vec3 wTangent;
    vec2 texCoord;
} surf;

layout(binding = 0, set = 0) uniform AppData
{
    UniformParams Params;
};

layout(binding = 1) uniform sampler2D diffuseTexture;

float shade2()
{   
    vec3 globCoord = surf.wPos;

    const vec3 mLightPos = Params.lightPos;
    const vec3 start = globCoord;
 
    const float h = 0.1f;
    const vec3 dir = normalize(mLightPos - start);

    float result = 0.0f;

    vec3 current = start;
    while (current.x >= Params.offsetPos.x && current.x <= width*Params.ampl.x  + Params.offsetPos.x
        && current.y >= Params.offsetPos.y && current.y <= 255.0f
        && current.z >= Params.offsetPos.z && current.z <= height*Params.ampl.z + Params.offsetPos.z)
    {
        current += h*dir;
        vec2 lol = vec2((current.x-Params.offsetPos.x)/(Params.ampl.x*width),
                        (current.y-Params.offsetPos.z)/(Params.ampl.z*height));

        float kek = texture(diffuseTexture, lol).x*Params.ampl.y + Params.offsetPos.y;

        if (current.y <= kek)
            result += 1.f;
    }

    const float minHits = 10.0f;
    return (minHits - min(result, minHits))/minHits;
}

float shade()
{
    const vec3 mLightPos = Params.lightPos;

    const vec3 start = vec3(surf.texCoord.x, textureLod(diffuseTexture, surf.texCoord, 0.0f).x, surf.texCoord.y);
    const float h = 1.f/float(width + height);
    const vec3 dir = normalize(mLightPos - start);

    float result = 0;

    vec3 current = start;
    while (current.x >=  0 && current.x <= 1
        && current.y >= -1 && current.y <= 1
        && current.z >=  0 && current.z <= 1)
    {
        current += h*dir;

        if (textureLod(diffuseTexture, current.xz, 0).r > current.y)
            result += 1.f;
    }

    const float minHits = 10;
    return (minHits - min(result, minHits))/minHits;
}

void main()
{
    vec3 lightDir1 = normalize(Params.lightPos - surf.wPos);
    vec3 lightDir2 = vec3(0.0f, 0.0f, 1.0f);

    vec4 lightColor1 = vec4(0.67f, 0.86f, 0.89f, 1.0f);
    vec4 lightColor2 = vec4(0.92f, 0.71f, 0.46f, 1.0f);

    vec3 N = surf.wNorm; 

    vec4 color1 = max(dot(N, lightDir1), 0.0f) * lightColor1;
    vec4 color2 = max(dot(N, lightDir2), 0.0f) * lightColor2;
    vec4 color_lights = mix(color1, color2, 0.5f);
    
    if(Params.isVSM == 1)
        out_fragColor = vec4(color_lights.xyz*max(shade2(), 0.5f), 1.0f);// * vec4(texture(diffuseTexture, surf.texCoord).xyz, 1.0f);
    else
        out_fragColor = color_lights * vec4(Params.baseColor, 1.0f);
}