@group(0) @binding(0) var<storage> modelViews : array<mat4x4<f32>>;
@group(0) @binding(1) var<uniform> projection : mat4x4<f32>;
@group(0) @binding(2) var<storage> colours : array<vec4<f32>>;

struct VertexOutput {
    @builtin(position) Position: vec4<f32>,
    @location(0) fragPosition: vec3<f32>,
    @location(1) fragNormal: vec3<f32>,
    @location(2) fragUV: vec2<f32>,
    @location(3) fragColour: vec4<f32>
};

@vertex
fn main(@builtin(instance_index) index: u32, @location(0) position: vec3<f32>, @location(1) normal: vec3<f32>, @location(2) uv: vec2<f32>) -> VertexOutput {
    let modelview = modelViews[index];
    let mvp = projection * modelview;
    let pos = vec4<f32>(position, 1.0);

    var output: VertexOutput;
    output.Position = mvp * pos;
    output.fragPosition = (modelview * pos).xyz;
    output.fragNormal = (modelview * vec4<f32>(normal, 0.0)).xyz;
    output.fragUV = uv;
    output.fragColour = colours[index];
    return output;
}

@group(1) @binding(0) var<uniform> ambientIntensity : f32;
@group(1) @binding(1) var<storage> pointLights : array<vec4<f32>>;
@group(1) @binding(2) var<uniform> numberOfPointLights: i32;
@fragment
fn fs_main(@location(0) pos: vec3<f32>, @location(1) normal: vec3<f32>, @location(2) uv: vec2<f32>, @location(3) colour: vec4<f32>) -> @location(0) vec4<f32> {
    let ambintLightColor: vec3<f32> = vec3(1.0, 1.0, 1.0);
    let pointLightColor: vec3<f32> = vec3(1.0, 1.0, 1.0);
    let dirLightColor: vec3<f32> = vec3(1.0, 1.0, 1.0);

    var lightResult: vec3<f32> = vec3(0.0, 0.0, 0.0);

    lightResult += ambintLightColor * ambientIntensity;

    for (var i: i32 = 0; i < numberOfPointLights; i = i + 1) {
        var offset = 2 * i;
        var pointPosition = pointLights[offset].xyz;
        var pointIntensity: f32 = pointLights[offset + 1][0];
        var pointRadius: f32 = pointLights[offset + 1][1];
        var L = pointPosition - pos;
        var distance = length(L);
        if distance < pointRadius {
            var diffuse: f32 = max(dot(normalize(L), normal), 0.0);
            var distanceFactor: f32 = pow(1.0 - distance / pointRadius, 2.0);
            lightResult += pointLightColor * pointIntensity * diffuse * distanceFactor;
        }
    }

    return vec4<f32>(colour.rgb * lightResult, 1.0);
}