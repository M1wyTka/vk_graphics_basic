#version 450
#extension GL_GOOGLE_include_directive : require

#include "common.h"

#define SSAO_KERNEL_SIZE 64
#define SSAO_RADIUS 0.5 

layout (binding = 0) uniform sampler2D samplerPosition;
layout (binding = 1) uniform sampler2D samplerNormal;
layout (binding = 2) uniform sampler2D samplerAlbedo;
layout (binding = 3) uniform sampler2D samplerNoise;

layout (binding = 4) uniform UBOSSAOKernel
{
    vec4 samples[SSAO_KERNEL_SIZE];
} uboSSAOKernel;

layout(push_constant) uniform params_t
{
    mat4 mProjView;
    vec4 lightPos;
    vec2 screenSize; 
    float lightRadius;
} params;

layout (location = 0) in vec2 inUV;

layout (location = 0) out vec4 outFragcolor;

float SSAO()
{
    const uvec2 renderingRes = uvec2(1024, 1024);
    const vec2 fragPos = gl_FragCoord.xy / vec2(renderingRes);
    
	const vec3 cPosition = textureLod(samplerPosition, fragPos, 0).xyz;
	
	// add to cam conversion


	//if (-cPosition.z > 100)
	//{
	//	//out_fragColor = 1.0;
	//	return 1.0f;
	//}


	const ivec2 noiseRes = textureSize(samplerNoise, 0);
	const vec2 noiseScale = vec2(renderingRes)/vec2(noiseRes);  
    const vec3 randomVec = vec3(textureLod(samplerNoise, fragPos*noiseScale, 0).xy, 0);

    const vec3 cNormal = textureLod(samplerNormal, fragPos, 0).xyz;
    const vec3 cTangent = normalize(randomVec - cNormal * dot(randomVec, cNormal));
	const vec3 cBitangent = cross(cTangent, cNormal);
	const mat3 TBN = mat3(cTangent, cBitangent, cNormal);


    float occlusion = 0.0f;
	// remove banding
	const float bias = 0.025f;
	for(uint i = 0; i < SSAO_KERNEL_SIZE; i++)
	{
		const vec3 tSampleDir = uboSSAOKernel.samples[i].xyz;
		const vec3 cSampleDir = (TBN * tSampleDir) * SSAO_RADIUS;
		const vec3 cSamplePos = cPosition + cSampleDir;

		// project
		vec4 offset = vec4(cSamplePos, 1.0f);
		offset = params.mProjView * offset;
		offset /= offset.w;
		offset.xyz = offset.xyz * 0.5f + 0.5f;

		vec3 cSample = texture(samplerPosition, offset.xy).xyz;

		float rangeCheck = smoothstep(0.0f, 1.0f, SSAO_RADIUS / abs(cPosition.z - cSample.z));
		occlusion += float(cSample.z >= cPosition.z + bias)
			// MAGICAL HACK
			* float(normalize(tSampleDir).z >= 0.5)
			* rangeCheck;
	}

    return occlusion;
}

void main() 
{
    vec2 uv = gl_FragCoord.xy / params.screenSize;
    vec3 fragPos = texture(samplerPosition, uv).rgb;
	vec3 normal  = texture(samplerNormal, uv).rgb;
	vec4 albedo  = texture(samplerAlbedo, uv);

    vec4 lol = texture(samplerNoise, uv);
    
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

    vec4 keke = uboSSAOKernel.samples[0];

	
	bool ssao = true;

	float occlusion = 1.0;

	if(ssao)
	   occlusion = 1.0 - (SSAO() / float(SSAO_KERNEL_SIZE));

    outFragcolor = lightColor * albedo * occlusion;
	//out_fragColor = 1.0 - (occlusion / float(SSAO_KERNEL_SIZE));
} 