#version 450
#extension GL_ARB_separate_shader_objects : enable
#extension GL_GOOGLE_include_directive : require

#include "common.h"

layout(location = 0) out vec4 out_fragColor;

layout (location = 0 ) in VS_OUT
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

layout (binding = 1) uniform sampler2D shadowMap;

layout(push_constant) uniform params_t
{
    mat4 mProjView;
    mat4 mModel;
} params;

float vsm(vec3 posLightSpaceNDC)
{
  const vec2 shadowTexCoord  = posLightSpaceNDC.xy*0.5f + vec2(0.5f, 0.5f);  // just shift coords from [-1,1] to [0,1]               
  
  // VSM part
  const bool  outOfView = (shadowTexCoord.x < 0.0001f || shadowTexCoord.x > 0.9999f || shadowTexCoord.y < 0.0001f || shadowTexCoord.y > 0.9999f);
  
  if(outOfView)
    return 0.f;

  const float t = posLightSpaceNDC.z;
  const float M1 = textureLod(shadowMap, shadowTexCoord, 0).x;
  if(!Params.isVSM)
    return (t < M1 + 0.001f) ? 1.0f : 0.0f;

  float M2 = textureLod(shadowMap, shadowTexCoord, 0).y - M1 * M1;
  M2 = max(M2, 0.001);
  float	pmax = M2 / ( M2 + (t - M1)*(t - M1));

  return (t > M1 + 0.0001f) ? pmax : 1.f;
}

void main()
{
  const vec4 posLightClipSpace = Params.lightMatrix*vec4(surf.wPos, 1.0f); // 
  const vec3 posLightSpaceNDC  = posLightClipSpace.xyz/posLightClipSpace.w;    // for orto matrix, we don't need perspective division, you can remove it if you want; this is general case;
  
  float shadow = vsm(posLightSpaceNDC);

  const vec4 dark_violet = vec4(0.59f, 0.0f, 0.82f, 1.0f);
  const vec4 chartreuse  = vec4(0.5f, 1.0f, 0.0f, 1.0f);

  vec4 lightColor1 = vec4(1.0f, 1.0f, 1.0f, 1.0f);//mix(dark_violet, chartreuse, abs(sin(Params.time)));
  vec4 lightColor2 = vec4(1.0f, 1.0f, 1.0f, 1.0f);
   
  vec3 lightDir   = normalize(Params.lightPos - surf.wPos);
  vec4 lightColor = max(dot(surf.wNorm, lightDir), 0.0f) * lightColor1;
  out_fragColor   = (lightColor*shadow + vec4(0.1f)) * vec4(Params.baseColor, 1.0f);
}