#ifndef VK_GRAPHICS_BASIC_COMMON_H
#define VK_GRAPHICS_BASIC_COMMON_H

#ifdef __cplusplus
#include <LiteMath.h>
using LiteMath::uint2;
using LiteMath::float2;
using LiteMath::float3;
using LiteMath::float4;
using LiteMath::float4x4;
using LiteMath::make_float2;
using LiteMath::make_float4;

typedef unsigned int uint;
typedef uint2        uvec2;
typedef float4       vec4;
typedef float3       vec3;
typedef float2       vec2;
typedef float4x4     mat4;

// Thank you Roma because flag padding made me go nuts
#define BOOL uint32_t
#else
#define BOOL bool
#endif

struct UniformParams
{
  mat4  lightMatrix;
  vec3  lightPos;
  float time;
  vec3  baseColor;
  BOOL isVSM;
  BOOL animateLightColor;
};

#undef BOOL
#endif //VK_GRAPHICS_BASIC_COMMON_H
