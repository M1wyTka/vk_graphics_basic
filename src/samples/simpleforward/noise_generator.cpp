#include "noise_generator.h"
#include <vector>
#include <cstdio>
#include <cmath>
#include <cstdlib>
#include <iostream>

BrownNoiseGenerator::BrownNoiseGenerator(int oct, double pers, int primeInd) : numOctaves(oct),
                                                                               persistence(pers),
                                                                               primeIndex(primeInd)
{
  // Generate seed
}

BrownNoiseGenerator::~BrownNoiseGenerator()
{
}

void BrownNoiseGenerator::GenerateBrownNoiseMap(std::vector<uint32_t> &noiseMap, int width, int height)
{
  std::vector<float> initialNoiseMap;

  float min = std::numeric_limits<float>::max();
  float max = std::numeric_limits<float>::min();

  noiseMap.resize(height * width);
  initialNoiseMap.resize(height * width);

  for (int i = 0; i < height; i++)
  {
    for (int j = 0; j < width; j++)
    {
      initialNoiseMap[i * width + j] = ValueNoise_2D(j, i);
      if (initialNoiseMap[i * width + j] < min)
        min = initialNoiseMap[i * width + j];
      if (initialNoiseMap[i * width + j] > max)
        max = initialNoiseMap[i * width + j];
    }
  }
  std::cout << "max: " << max << " min: " << min << std::endl;

  for (int i = 0; i < initialNoiseMap.size(); i++)
  {
    initialNoiseMap[i] -= min;
  }

  for (int i = 0; i < height; i++)
  {
    for (int j = 0; j < width; j++)
    {
      noiseMap[i * width + j] = 255 * initialNoiseMap[i * width + j];
    }
  }
}

double BrownNoiseGenerator::Noise(int i, int x, int y)
{
  int n = x + y * 57;
  n     = (n << 13) ^ n;
  int a = primes[i][0], b = primes[i][1], c = primes[i][2];
  int t = (n * (n * n * a + b) + c) & 0x7fffffff;
  return 1.0 - (double)(t) / 1073741824.0;
}

double BrownNoiseGenerator::SmoothedNoise(int i, int x, int y)
{
  double corners = (Noise(i, x - 1, y - 1) + Noise(i, x + 1, y - 1) + Noise(i, x - 1, y + 1) + Noise(i, x + 1, y + 1)) / 16,
         sides   = (Noise(i, x - 1, y) + Noise(i, x + 1, y) + Noise(i, x, y - 1) + Noise(i, x, y + 1)) / 8,
         center  = Noise(i, x, y) / 4;
  return corners + sides + center;
}

double BrownNoiseGenerator::Interpolate(double a, double b, double x)
{
  double ft = x * 3.1415927,
         f  = (1 - cos(ft)) * 0.5;
  return a * (1 - f) + b * f;
}

double BrownNoiseGenerator::InterpolatedNoise(int i, double x, double y)
{
  int integer_X       = x;
  double fractional_X = x - integer_X;
  int integer_Y       = y;
  double fractional_Y = y - integer_Y;

  double v1 = SmoothedNoise(i, integer_X, integer_Y),
         v2 = SmoothedNoise(i, integer_X + 1, integer_Y),
         v3 = SmoothedNoise(i, integer_X, integer_Y + 1),
         v4 = SmoothedNoise(i, integer_X + 1, integer_Y + 1),
         i1 = Interpolate(v1, v2, fractional_X),
         i2 = Interpolate(v3, v4, fractional_X);
  return Interpolate(i1, i2, fractional_Y);
}

double BrownNoiseGenerator::ValueNoise_2D(double x, double y)
{
  double total     = 0,
         frequency = pow(2, numOctaves),
         amplitude = 1;
  for (int i = 0; i < numOctaves; ++i)
  {
    frequency /= 2;
    amplitude *= persistence;
    total += InterpolatedNoise((primeIndex + i) % maxPrimeIndex,
               x / frequency,
               y / frequency)
             * amplitude;
  }
  return total / frequency;
}