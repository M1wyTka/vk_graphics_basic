#version 450
#extension GL_ARB_separate_shader_objects : enable

layout(location = 0) out vec4 color;

layout (binding = 0) uniform sampler2D colorTex;

layout (location = 0) in VS_OUT
{
  vec2 texCoord;
} surf;

layout(push_constant) uniform params_t
{
    mat4 mProjView;
    mat4 mModel;
} params;


vec3 reinhard(vec3 color)
{
    return color / (color + vec3(1.0));
}

vec3 reinhard_extended(vec3 color, float max_white)
{
    vec3 numerator = color * (1.0f + (color / vec3(max_white * max_white)));
    return numerator / (color + vec3(1.0));
}

vec3 exposure(vec3 color)
{
    float exposure_bias = 2.0f;
    return vec3(1.0) - exp(-color * exposure_bias);
}

vec3 uncharted2_tonemap_partial(vec3 color)
{
    float A = 0.15f;
    float B = 0.50f;
    float C = 0.10f;
    float D = 0.20f;
    float E = 0.02f;
    float F = 0.30f;
    return ((color*(A*color+C*B)+D*E)/(color*(A*color+B)+D*F))-E/F;
}

vec3 uncharted2_filmic(vec3 color)
{
    float exposure_bias = 2.0f;
    vec3 curr = uncharted2_tonemap_partial(color * exposure_bias);

    vec3 W = vec3(11.2f);
    vec3 white_scale = vec3(1.0f) / uncharted2_tonemap_partial(W);
    return curr * white_scale;
}

vec3 rtt_and_odt_fit(vec3 color)
{
    vec3 a = color * (color + 0.0245786f) - 0.000090537f;
    vec3 b = color * (0.983729f * color + 0.4329510f) + 0.238081f;
    return a / b;
}

vec3 aces_approx(vec3 color)
{
    color *= 0.6f;
    float a = 2.51f;
    float b = 0.03f;
    float c = 2.43f;
    float d = 0.59f;
    float e = 0.14f;
    return clamp((color*(a*color+b))/(color*(c*color+d)+e), 0.0f, 1.0f);
}

void main()
{
  vec2 uv = surf.texCoord;
  uv.y = uv.y + 1;

  // CRUTCH 
  float type = params.mProjView[0][0]; 
  int TMType = int(type);

  vec3 tex = textureLod(colorTex, uv, 0).xyz;
  if(TMType == 0)
  {
    color = vec4(tex, 1.0f);
  } else if(TMType == 1)
  {
    color = vec4(reinhard(tex), 1.0f);
  } else if(TMType == 2)
  {
    color = vec4(reinhard_extended(tex, 1.0f), 1.0f);
  } else if(TMType == 3)
  {
    color = vec4(exposure(tex), 1.0f);
  } else if(TMType == 4)
  {
    color = vec4(uncharted2_filmic(tex), 1.0f);
  } else if(TMType == 5)
  {
    color = vec4(rtt_and_odt_fit(tex), 1.0f);        
  } else if(TMType == 6)
  {
    color = vec4(aces_approx(tex), 1.0f);
  } else {
    color = vec4(0.0f, 0.0f, 1.0f, 1.0f);
  }
}