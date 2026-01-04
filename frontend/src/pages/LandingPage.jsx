import React, { useEffect, useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Mesh, Program, Renderer, Triangle, Vec3 } from 'ogl';
import { Link, Brain, TrendingUp, Zap } from 'lucide-react';

// --- Orb Component ---
const Orb = ({
  hue = 280,
  hoverIntensity = 0.11,
  rotateOnHover = true,
  forceHoverState = false,
  backgroundColor = '#0f0b1f'
}) => {
  const ctnDom = useRef(null);

  const vert = /* glsl */ `
    precision highp float;
    attribute vec2 position;
    attribute vec2 uv;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  const frag = /* glsl */ `
    precision highp float;

    uniform float iTime;
    uniform vec3 iResolution;
    uniform float hue;
    uniform float hover;
    uniform float rot;
    uniform float hoverIntensity;
    uniform vec3 backgroundColor;
    varying vec2 vUv;

    vec3 rgb2yiq(vec3 c) {
      float y = dot(c, vec3(0.299, 0.587, 0.114));
      float i = dot(c, vec3(0.596, -0.274, -0.322));
      float q = dot(c, vec3(0.211, -0.523, 0.312));
      return vec3(y, i, q);
    }
    
    vec3 yiq2rgb(vec3 c) {
      float r = c.x + 0.956 * c.y + 0.621 * c.z;
      float g = c.x - 0.272 * c.y - 0.647 * c.z;
      float b = c.x - 1.106 * c.y + 1.703 * c.z;
      return vec3(r, g, b);
    }
    
    vec3 adjustHue(vec3 color, float hueDeg) {
      float hueRad = hueDeg * 3.14159265 / 180.0;
      vec3 yiq = rgb2yiq(color);
      float cosA = cos(hueRad);
      float sinA = sin(hueRad);
      float i = yiq.y * cosA - yiq.z * sinA;
      float q = yiq.y * sinA + yiq.z * cosA;
      yiq.y = i;
      yiq.z = q;
      return yiq2rgb(yiq);
    }

    vec3 hash33(vec3 p3) {
      p3 = fract(p3 * vec3(0.1031, 0.11369, 0.13787));
      p3 += dot(p3, p3.yxz + 19.19);
      return -1.0 + 2.0 * fract(vec3(
        p3.x + p3.y,
        p3.x + p3.z,
        p3.y + p3.z
      ) * p3.zyx);
    }

    float snoise3(vec3 p) {
      const float K1 = 0.333333333;
      const float K2 = 0.166666667;
      vec3 i = floor(p + (p.x + p.y + p.z) * K1);
      vec3 d0 = p - (i - (i.x + i.y + i.z) * K2);
      vec3 e = step(vec3(0.0), d0 - d0.yzx);
      vec3 i1 = e * (1.0 - e.zxy);
      vec3 i2 = 1.0 - e.zxy * (1.0 - e);
      vec3 d1 = d0 - (i1 - K2);
      vec3 d2 = d0 - (i2 - K1);
      vec3 d3 = d0 - 0.5;
      vec4 h = max(0.6 - vec4(
        dot(d0, d0),
        dot(d1, d1),
        dot(d2, d2),
        dot(d3, d3)
      ), 0.0);
      vec4 n = h * h * h * h * vec4(
        dot(d0, hash33(i)),
        dot(d1, hash33(i + i1)),
        dot(d2, hash33(i + i2)),
        dot(d3, hash33(i + 1.0))
      );
      return dot(vec4(31.316), n);
    }

    vec4 extractAlpha(vec3 colorIn) {
      float a = max(max(colorIn.r, colorIn.g), colorIn.b);
      return vec4(colorIn.rgb / (a + 1e-5), a);
    }

    const vec3 baseColor1 = vec3(0.611765, 0.262745, 0.996078);
    const vec3 baseColor2 = vec3(0.298039, 0.760784, 0.913725);
    const vec3 baseColor3 = vec3(0.062745, 0.078431, 0.600000);
    const float innerRadius = 0.6;
    const float noiseScale = 0.65;

    float light1(float intensity, float attenuation, float dist) {
      return intensity / (1.0 + dist * attenuation);
    }
    float light2(float intensity, float attenuation, float dist) {
      return intensity / (1.0 + dist * dist * attenuation);
    }

    vec4 draw(vec2 uv) {
      vec3 color1 = adjustHue(baseColor1, hue);
      vec3 color2 = adjustHue(baseColor2, hue);
      vec3 color3 = adjustHue(baseColor3, hue);
      
      float ang = atan(uv.y, uv.x);
      float len = length(uv);
      float invLen = len > 0.0 ? 1.0 / len : 0.0;

      float bgLuminance = dot(backgroundColor, vec3(0.299, 0.587, 0.114));
      
      float n0 = snoise3(vec3(uv * noiseScale, iTime * 0.5)) * 0.5 + 0.5;
      float r0 = mix(mix(innerRadius, 1.0, 0.4), mix(innerRadius, 1.0, 0.6), n0);
      float d0 = distance(uv, (r0 * invLen) * uv);
      float v0 = light1(1.0, 10.0, d0);
      v0 *= smoothstep(r0 * 1.05, r0, len);
      float innerFade = smoothstep(r0 * 0.8, r0 * 0.95, len);
      v0 *= mix(innerFade, 1.0, bgLuminance * 0.7);
      float cl = cos(ang + iTime * 2.0) * 0.5 + 0.5;
      
      float a = iTime * -1.0;
      vec2 pos = vec2(cos(a), sin(a)) * r0;
      float d = distance(uv, pos);
      float v1 = light2(1.5, 5.0, d);
      v1 *= light1(1.0, 50.0, d0);
      
      float v2 = smoothstep(1.0, mix(innerRadius, 1.0, n0 * 0.5), len);
      float v3 = smoothstep(innerRadius, mix(innerRadius, 1.0, 0.5), len);
      
      vec3 colBase = mix(color1, color2, cl);
      float fadeAmount = mix(1.0, 0.1, bgLuminance);
      
      vec3 darkCol = mix(color3, colBase, v0);
      darkCol = (darkCol + v1) * v2 * v3;
      darkCol = clamp(darkCol, 0.0, 1.0);
      
      vec3 lightCol = (colBase + v1) * mix(1.0, v2 * v3, fadeAmount);
      lightCol = mix(backgroundColor, lightCol, v0);
      lightCol = clamp(lightCol, 0.0, 1.0);
      
      vec3 finalCol = mix(darkCol, lightCol, bgLuminance);
      
      return extractAlpha(finalCol);
    }

    vec4 mainImage(vec2 fragCoord) {
      vec2 center = iResolution.xy * 0.5;
      float size = min(iResolution.x, iResolution.y);
      vec2 uv = (fragCoord - center) / size * 2.0;
      
      float angle = rot;
      float s = sin(angle);
      float c = cos(angle);
      uv = vec2(c * uv.x - s * uv.y, s * uv.x + c * uv.y);
      
      uv.x += hover * hoverIntensity * 0.1 * sin(uv.y * 10.0 + iTime);
      uv.y += hover * hoverIntensity * 0.1 * sin(uv.x * 10.0 + iTime);
      
      return draw(uv);
    }

    void main() {
      vec2 fragCoord = vUv * iResolution.xy;
      vec4 col = mainImage(fragCoord);
      gl_FragColor = vec4(col.rgb * col.a, col.a);
    }
  `;

  useEffect(() => {
    const container = ctnDom.current;
    if (!container) return;

    const renderer = new Renderer({ alpha: true, premultipliedAlpha: false });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    container.appendChild(gl.canvas);

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex: vert,
      fragment: frag,
      uniforms: {
        iTime: { value: 0 },
        iResolution: {
          value: new Vec3(gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height)
        },
        hue: { value: hue },
        hover: { value: 0 },
        rot: { value: 0 },
        hoverIntensity: { value: hoverIntensity },
        backgroundColor: { value: hexToVec3(backgroundColor) }
      }
    });

    const mesh = new Mesh(gl, { geometry, program });

    function resize() {
      if (!container) return;
      const dpr = window.devicePixelRatio || 1;
      const width = container.clientWidth;
      const height = container.clientHeight;
      renderer.setSize(width * dpr, height * dpr);
      gl.canvas.style.width = width + 'px';
      gl.canvas.style.height = height + 'px';
      program.uniforms.iResolution.value.set(gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height);
    }
    window.addEventListener('resize', resize);
    resize();

    let targetHover = 0;
    let lastTime = 0;
    let currentRot = 0;
    const rotationSpeed = 0.3;

    const handleMouseMove = e => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const width = rect.width;
      const height = rect.height;
      const size = Math.min(width, height);
      const centerX = width / 2;
      const centerY = height / 2;
      const uvX = ((x - centerX) / size) * 2.0;
      const uvY = ((y - centerY) / size) * 2.0;

      if (Math.sqrt(uvX * uvX + uvY * uvY) < 0.8) {
        targetHover = 1;
      } else {
        targetHover = 0;
      }
    };

    const handleMouseLeave = () => {
      targetHover = 0;
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    let rafId;
    const update = t => {
      rafId = requestAnimationFrame(update);
      const dt = (t - lastTime) * 0.001;
      lastTime = t;
      program.uniforms.iTime.value = t * 0.001;
      program.uniforms.hue.value = hue;
      program.uniforms.hoverIntensity.value = hoverIntensity;
      program.uniforms.backgroundColor.value = hexToVec3(backgroundColor);

      const effectiveHover = forceHoverState ? 1 : targetHover;
      program.uniforms.hover.value += (effectiveHover - program.uniforms.hover.value) * 0.1;

      if (rotateOnHover && effectiveHover > 0.5) {
        currentRot += dt * rotationSpeed;
      }
      program.uniforms.rot.value = currentRot;

      renderer.render({ scene: mesh });
    };
    rafId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      if (container.contains(gl.canvas)) {
        container.removeChild(gl.canvas);
      }
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [hue, hoverIntensity, rotateOnHover, forceHoverState, backgroundColor]);

  return <div ref={ctnDom} className="w-full h-full" />;
};

function hexToVec3(color) {
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16) / 255;
    const g = parseInt(color.slice(3, 5), 16) / 255;
    const b = parseInt(color.slice(5, 7), 16) / 255;
    return new Vec3(r, g, b);
  }
  return new Vec3(0.059, 0.043, 0.122);
}

// --- Reusable Stat Card Component ---
const StatCard = ({ value, label, suffix = "" }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => {
    if (value === 4.9) return latest.toFixed(1);
    return Math.round(latest);
  });

  useEffect(() => {
    const controls = animate(count, value, { duration: 2, ease: "easeOut" });
    return controls.stop;
  }, [value]);

  return (
    <motion.div 
      whileHover={{ y: -5, backgroundColor: "#1a1a1a" }}
      className="bg-[#111111] border border-white/5 p-8 rounded-2xl flex flex-col items-center justify-center text-center shadow-xl transition-colors"
    >
      <div className="text-3xl md:text-4xl font-bold mb-2 flex items-center">
        <motion.span>{rounded}</motion.span>
        <span>{suffix}</span>
      </div>
      <div className="text-gray-500 text-sm font-medium uppercase tracking-wider">
        {label}
      </div>
    </motion.div>
  );
};

// --- Hero Section Component ---
const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative w-full min-h-screen bg-[#0f0b1f] text-white overflow-hidden font-sans">
      {/* Orb Animation Background */}
      <div className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
        <Orb
          hue={280}
          hoverIntensity={0.11}
          rotateOnHover={false}
          forceHoverState={false}
          backgroundColor="#0f0b1f"
        />
      </div>

      {/* Cosmic Background with Purple Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Main gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a0f2e]/80 via-[#0f0b1f]/60 to-[#050208]/80" />
        
        {/* Large purple glow - top left */}
        <div className="absolute top-[-20%] left-[-10%] w-[1000px] h-[1000px] bg-purple-700/20 rounded-full blur-[200px]" />
        
        {/* Purple glow - top right */}
        <div className="absolute top-[-15%] right-[-10%] w-[800px] h-[800px] bg-purple-600/15 rounded-full blur-[180px]" />
        
        {/* Center glow for depth */}
        <div className="absolute top-[30%] left-[50%] -translate-x-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[150px]" />
        
        {/* Subtle grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }}
        />

        {/* Curved line accent - top */}
        <div className="absolute top-0 left-0 w-full h-[400px] overflow-hidden opacity-10">
          <div className="absolute top-[100px] left-[-100px] w-[800px] h-[800px] border border-white/20 rounded-full" />
        </div>
      </div>

      {/* Navigation Bar */}
      <nav className="flex items-center justify-between px-6 md:px-12 py-6 max-w-7xl mx-auto relative z-50">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 via-purple-600 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
            <div className="w-5 h-5 bg-white/90 rounded-md" />
          </div>
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-10 text-sm font-medium">
          <a href="#home" className="text-gray-300 hover:text-white transition-colors">Home</a>
          <a href="#feature" className="text-gray-300 hover:text-white transition-colors">Feature</a>
          <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</a>
          <a href="#testimonial" className="text-gray-300 hover:text-white transition-colors">Testimonial</a>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          {/* X/Twitter Icon Button */}
          <button className="w-10 h-10 bg-white/[0.06] hover:bg-white/10 rounded-xl flex items-center justify-center border border-white/[0.08] transition-all">
            <svg className="w-[18px] h-[18px] text-gray-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </button>

          {/* Join Waitlist Button */}
          <button 
            onClick={() => navigate('/Login')}
            className="px-6 py-2.5 bg-purple-600/90 hover:bg-purple-600 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-purple-500/25 border border-purple-500/20"
          >
            Join waitlist
          </button>
        </div>
      </nav>

      {/* Hero Content - Higher z-index to stay above cards */}
      <div className="flex flex-col items-center justify-center px-6 pt-12 md:pt-16 pb-[380px] md:pb-[450px] text-center max-w-6xl mx-auto relative z-40">
        {/* Latest Integration Badge */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2.5 bg-white/[0.06] backdrop-blur-xl border border-white/10 px-5 py-2.5 rounded-full mb-8"
        >
          <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
          </svg>
          <span className="text-gray-200 text-sm font-medium tracking-wide">Latest integration just arrived</span>
        </motion.div>

        {/* Main Headline */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-7xl lg:text-[90px] font-bold tracking-tight leading-[1.1] mb-7"
        >
          Boost your<br />
          <span className="bg-gradient-to-r from-purple-400 via-pink-300 to-purple-300 text-transparent bg-clip-text">
            Financial rankings with AI
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-gray-400 text-lg md:text-xl max-w-2xl leading-relaxed mb-12"
        >
          Elevate your site's visibility effortlessly with AI, where smart<br className="hidden md:block" />
          technology meets user-friendly financial tools.
        </motion.p>

        {/* CTA Button - Enhanced Visibility */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.05, boxShadow: "0 25px 50px -12px rgba(168, 85, 247, 0.5)" }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/register')}
          className="relative px-12 py-4 bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 hover:from-purple-500 hover:via-purple-600 hover:to-purple-500 rounded-full font-bold text-lg text-white shadow-2xl shadow-purple-500/50 transition-all border border-purple-400/30"
        >
          <span className="relative z-10">Start For Free</span>
          {/* Button glow effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 opacity-20 blur-xl" />
        </motion.button>
      </div>

      {/* Credit Card Mockups Section - Transparent Glassmorphism Cards */}
      <div className="absolute bottom-0 left-0 right-0 w-full px-6 pb-0 z-30">
        <div className="max-w-7xl mx-auto">
          <div className="relative h-[320px] md:h-[420px] flex items-center justify-center">
            
            {/* Left Card (Transparent Glassmorphism) - Front View with Rotation */}
            <motion.div
              initial={{ opacity: 0, x: -150, rotateZ: 0, rotateY: 0 }}
              animate={{ 
                opacity: 1, 
                x: 0, 
                rotateZ: -12,
                rotateY: -20
              }}
              transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
              className="absolute left-[2%] md:left-[8%] top-1/2 -translate-y-1/2"
              style={{ 
                perspective: '1500px',
                transformStyle: 'preserve-3d'
              }}
            >
              <div 
                className="w-[260px] md:w-[360px] h-[165px] md:h-[230px] bg-white/[0.03] backdrop-blur-xl rounded-[20px] md:rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.5)] border border-white/10"
                style={{ 
                  transform: 'rotateX(5deg)',
                  transformStyle: 'preserve-3d'
                }}
              >
                <div className="absolute inset-0 rounded-[20px] md:rounded-[24px] overflow-hidden p-6 md:p-8 flex flex-col justify-between">
                  {/* Top section */}
                  <div className="flex justify-between items-start">
                    <div className="text-gray-400 text-xs md:text-sm font-mono">
                      02.50
                    </div>
                    <div className="w-10 h-10 md:w-14 md:h-14 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-lg md:rounded-xl shadow-lg" />
                  </div>
                  
                  {/* Bottom section */}
                  <div className="space-y-2">
                    <div className="text-gray-300 text-xs md:text-sm font-mono tracking-wider">
                      3455 1552 7118
                    </div>
                    <div className="text-gray-400 text-xs md:text-sm font-medium">
                      Aun khan
                    </div>
                  </div>

                  {/* Subtle shine effect */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-2xl" />
                </div>
              </div>
            </motion.div>

            {/* Center Card (Purple Glassmorphism) - Main Hero Card */}
            <motion.div
              initial={{ opacity: 0, y: 80, scale: 0.9 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                scale: 1,
                rotateX: 0
              }}
              transition={{ delay: 0.6, duration: 1, ease: "easeOut" }}
              className="relative z-10"
              style={{ 
                perspective: '1500px',
                transformStyle: 'preserve-3d'
              }}
            >
              <div 
                className="w-[280px] md:w-[400px] h-[175px] md:h-[250px] bg-gradient-to-br from-purple-500/25 via-purple-600/20 to-indigo-600/25 rounded-[22px] md:rounded-[28px] shadow-[0_30px_90px_rgba(124,58,237,0.4)] border border-white/20 backdrop-blur-2xl"
                style={{ 
                  transform: 'rotateX(-2deg)',
                  transformStyle: 'preserve-3d'
                }}
              >
                {/* Glass morphism overlay */}
                <div className="absolute inset-0 bg-white/[0.05] backdrop-blur-xl rounded-[22px] md:rounded-[28px]" />
                
                <div className="relative p-6 md:p-8 h-full flex flex-col justify-between">
                  {/* Top section */}
                  <div className="flex justify-between items-start">
                    <div className="text-white/60 text-xs md:text-sm font-medium">
                      Aun khan
                    </div>
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-amber-300 via-amber-400 to-yellow-500 rounded-xl md:rounded-2xl shadow-xl shadow-amber-500/30" />
                  </div>
                  
                  {/* Contactless payment icon - centered */}
                  <div className="absolute left-6 md:left-8 top-1/2 -translate-y-1/2">
                    <svg className="w-7 h-7 md:w-9 md:h-9 text-white/30" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                    </svg>
                  </div>

                  {/* Bottom section */}
                  <div className="space-y-1.5">
                    <div className="text-white/80 text-xs md:text-sm uppercase tracking-widest font-medium">
                      Membership
                    </div>
                    <div className="text-white/60 text-[10px] md:text-xs uppercase tracking-wider">
                      Type
                    </div>
                  </div>

                  {/* Decorative glow */}
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-pink-400/15 to-transparent rounded-full blur-3xl" />
                </div>
              </div>
            </motion.div>

            {/* Right Card (Transparent Glassmorphism) - Back View with Magnetic Strip */}
            <motion.div
              initial={{ opacity: 0, x: 150, rotateZ: 0, rotateY: 0 }}
              animate={{ 
                opacity: 1, 
                x: 0, 
                rotateZ: 12,
                rotateY: 20
              }}
              transition={{ delay: 0.7, duration: 1, ease: "easeOut" }}
              className="absolute right-[2%] md:right-[8%] top-1/2 -translate-y-1/2"
              style={{ 
                perspective: '1500px',
                transformStyle: 'preserve-3d'
              }}
            >
              <div 
                className="w-[260px] md:w-[360px] h-[165px] md:h-[230px] bg-white/[0.03] backdrop-blur-xl rounded-[20px] md:rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.5)] border border-white/10"
                style={{ 
                  transform: 'rotateX(5deg)',
                  transformStyle: 'preserve-3d'
                }}
              >
                <div className="absolute inset-0 rounded-[20px] md:rounded-[24px] overflow-hidden">
                  {/* Magnetic strip */}
                  <div className="absolute top-10 md:top-14 left-0 right-0 h-10 md:h-12 bg-black/60 backdrop-blur-sm" />
                  
                  {/* CVV/Price section */}
                  <div className="absolute bottom-8 md:bottom-12 right-6 md:right-8">
                    <div className="text-gray-400 text-sm md:text-base font-mono">$519</div>
                  </div>

                  {/* Chip icon bottom right */}
                  <div className="absolute bottom-6 md:bottom-8 right-6 md:right-8">
                    <svg className="w-9 h-9 md:w-11 md:h-11 text-white/15" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                  </div>

                  {/* Subtle lines/pattern */}
                  <div className="absolute bottom-14 md:bottom-20 left-6 md:left-8 right-6 md:right-8 h-8 md:h-10 bg-white/5 backdrop-blur-sm rounded" />
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </section>
  );
};

// --- Updated Info Section Component ---
const InfoSection = () => {
  const companies = [
    { name: "Acquia", icon: "🚀" },
    { name: "Datazo", icon: "⚡" },
    { name: "Orion", icon: "🌙" },
    { name: "Lynx", icon: "⭐" },
    { name: "Phoenix", icon: "🔥" },
    { name: "Cetis", icon: "⚙️" }
  ];

  const features = [
    { 
      id: 1, 
      title: "Financial Tracking", 
      desc: "Track your income and expense accurately. Know where every penny goes.", 
      icon: "😊",
      gradient: "from-orange-500/10 to-amber-500/10",
      iconBg: "from-amber-500/20 to-orange-500/20",
      iconColor: "text-amber-400",
      glowColor: "from-amber-500/20 to-orange-500/20"
    },
    { 
      id: 2, 
      title: "Budget Planning", 
      desc: "Set and achieve your financial goals. Make budgeting easy and effective.", 
      icon: "📢",
      gradient: "from-purple-500/10 to-pink-500/10",
      iconBg: "from-purple-500/20 to-pink-500/20",
      iconColor: "text-purple-400",
      glowColor: "from-purple-500/20 to-pink-500/20"
    },
    { 
      id: 3, 
      title: "Investment Analysis", 
      desc: "Understand and optimize your investments. Grow and secure your wealth.", 
      icon: "📊",
      gradient: "from-blue-500/10 to-cyan-500/10",
      iconBg: "from-blue-500/20 to-cyan-500/20",
      iconColor: "text-cyan-400",
      glowColor: "from-blue-500/20 to-cyan-500/20"
    }
  ];

  return (
    <section className="relative bg-gradient-to-b from-[#050208] via-[#0a0a0f] to-[#0f0b1f] py-24 px-6 md:px-12 text-white overflow-hidden">
      {/* Background Effects - Enhanced */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Animated purple glows */}
        <motion.div 
          animate={{ 
            opacity: [0.1, 0.2, 0.1],
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[150px]"
        />
        <motion.div 
          animate={{ 
            opacity: [0.1, 0.15, 0.1],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 10, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 1 
          }}
          className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[120px]"
        />
        <motion.div 
          animate={{ 
            opacity: [0.05, 0.15, 0.05],
            x: [-50, 50, -50]
          }}
          transition={{ 
            duration: 15, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px]"
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Trust Section - Companies */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <p className="text-gray-400 text-sm md:text-base mb-8 font-medium">
            Relied upon by over <span className="text-white font-bold">6400+</span> individuals from around the world
          </p>
          
          {/* Company Logos Grid */}
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {companies.map((company, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1, duration: 0.4 }}
                viewport={{ once: true }}
                whileHover={{ 
                  scale: 1.15,
                  y: -5
                }}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <motion.span 
                  whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.5 }}
                  className="text-xl"
                >
                  {company.icon}
                </motion.span>
                <span className="text-sm md:text-base font-semibold tracking-wide">{company.name}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Main Content Section */}
        <div className="space-y-16">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-3xl mx-auto"
          >
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-4xl md:text-6xl font-bold mb-6 tracking-tight"
            >
              Budget Your Way
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-gray-400 text-lg md:text-xl leading-relaxed"
            >
              Set achievable goals, track your budget, and reach them your way.
            </motion.p>
          </motion.div>

          {/* Feature Cards Grid - Transparent Glassmorphism */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {features.map((feature, idx) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ 
                  delay: idx * 0.15,
                  duration: 0.6,
                  ease: "easeOut"
                }}
                viewport={{ once: true }}
                whileHover={{ 
                  y: -12, 
                  scale: 1.03,
                  transition: { duration: 0.3 }
                }}
                className="relative group cursor-pointer"
              >
                {/* Main Card - Transparent Glassmorphism */}
                <div className={`
                  relative bg-white/[0.03] backdrop-blur-xl 
                  border border-white/10 rounded-3xl p-8 
                  overflow-hidden h-full
                  transition-all duration-500
                  group-hover:border-white/20
                  group-hover:bg-white/[0.06]
                  group-hover:shadow-[0_20px_60px_rgba(168,85,247,0.15)]
                `}>
                  
                  {/* Animated Gradient Overlay on Hover */}
                  <motion.div 
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} rounded-3xl pointer-events-none`}
                  />
                  
                  {/* Shimmer Effect */}
                  <motion.div
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none"
                  />
                  
                  {/* Content */}
                  <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                    {/* Icon with Gradient Background */}
                    <motion.div 
                      whileHover={{ 
                        rotate: [0, -10, 10, -10, 0],
                        scale: 1.1
                      }}
                      transition={{ duration: 0.5 }}
                      className={`
                        w-16 h-16 bg-gradient-to-br ${feature.iconBg}
                        rounded-2xl flex items-center justify-center 
                        text-3xl backdrop-blur-sm border border-white/20 
                        shadow-lg group-hover:shadow-xl
                        transition-all duration-300
                      `}
                    >
                      <motion.span
                        animate={{ 
                          scale: [1, 1.1, 1]
                        }}
                        transition={{ 
                          duration: 2, 
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        {feature.icon}
                      </motion.span>
                    </motion.div>

                    {/* Title */}
                    <motion.h3 
                      className="text-xl md:text-2xl font-bold tracking-tight text-white"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                    >
                      {feature.title}
                    </motion.h3>

                    {/* Description */}
                    <motion.p 
                      className="text-gray-300 text-sm md:text-base leading-relaxed"
                      initial={{ opacity: 0.8 }}
                      whileHover={{ opacity: 1 }}
                    >
                      {feature.desc}
                    </motion.p>
                  </div>

                  {/* Bottom Accent Line */}
                  <motion.div 
                    initial={{ scaleX: 0 }}
                    whileHover={{ scaleX: 1 }}
                    transition={{ duration: 0.4 }}
                    className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.gradient} origin-left`}
                  />
                  
                  {/* Decorative Corner Blur - Animated */}
                  <motion.div 
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 0.5, 0.3]
                    }}
                    transition={{ 
                      duration: 4, 
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className={`absolute -bottom-10 -right-10 w-32 h-32 bg-gradient-to-tl ${feature.glowColor} rounded-full blur-3xl`}
                  />
                  
                  {/* Top Corner Glow */}
                  <motion.div 
                    animate={{ 
                      scale: [1, 1.1, 1],
                      opacity: [0.2, 0.4, 0.2]
                    }}
                    transition={{ 
                      duration: 5, 
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 1
                    }}
                    className={`absolute -top-10 -left-10 w-32 h-32 bg-gradient-to-br ${feature.glowColor} rounded-full blur-3xl`}
                  />
                </div>

                {/* Outer Glow Effect on Hover */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                  className={`
                    absolute -inset-1 bg-gradient-to-br ${feature.glowColor}
                    rounded-3xl blur-xl -z-10 opacity-0
                    group-hover:opacity-100
                  `}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// --- Enhanced Stats & CTA Section Component ---
const StatsAndCTA = () => {
  const navigate = useNavigate();

  const pricingPlans = [
    {
      name: "Starter Plan",
      price: 9,
      period: "/month",
      features: [
        "Automatic savings tracking",
        "Weekly or monthly budgeting tips"
      ],
      popular: false
    },
    {
      name: "Pro Plan",
      price: 19,
      period: "/month",
      features: [
        "Personalized goal setting",
        "Advanced expense analysis"
      ],
      popular: true
    },
    {
      name: "Advanced Plan",
      price: 29,
      period: "/month",
      features: [
        "Investment portfolio insights",
        "Priority customer support"
      ],
      popular: false
    }
  ];

  const monitoringFeatures = [
    { icon: "🎯", text: "Receive actionable insights", color: "text-purple-300" },
    { icon: "💳", text: "Monitor accounts and transactions", color: "text-pink-300" },
    { icon: "📊", text: "Stay within spending targets", color: "text-indigo-300" },
    { icon: "🔔", text: "Reminders for upcoming bills and payments", color: "text-purple-300" }
  ];

  return (
    <section className="relative bg-gradient-to-b from-[#0f0b1f] via-[#0a0a0f] to-[#050208] py-24 px-6 md:px-12 text-white overflow-hidden">
      {/* Background Effects - Matching Hero Section */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Main gradient blurs */}
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-purple-700/10 rounded-full blur-[100px]" />
        
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10 space-y-32">
        
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16 items-stretch">
          
          {/* LEFT SIDE - Start Small, Dream Big with Pricing */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl p-8 md:p-10 hover:border-purple-500/30 transition-all duration-300 group flex flex-col"
          >
            {/* Gradient Overlay on Hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
            
            <div className="relative z-10 flex-1 flex flex-col">
              {/* Header */}
              <div className="mb-10">
                <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight bg-gradient-to-r from-white via-purple-100 to-white text-transparent bg-clip-text">
                  Start Small, Dream Big
                </h2>
                <p className="text-gray-300 text-base md:text-lg leading-relaxed">
                  Control your finances effectively. Plans start at $9/month, enabling powerful yet affordable financial guidance.
                </p>
              </div>

              {/* Pricing Cards - Stacked Vertically */}
              <div className="space-y-4 flex-1">
                {pricingPlans.map((plan, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    viewport={{ once: true }}
                    whileHover={{ scale: 1.02, x: 5 }}
                    className={`relative bg-white/[0.04] backdrop-blur-sm border border-white/10 rounded-2xl p-6 overflow-hidden group/card cursor-pointer transition-all ${
                      plan.popular ? 'ring-1 ring-purple-500/40' : ''
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute top-3 right-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                        POPULAR
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      {/* Left: Name & Features */}
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white/90 mb-3">{plan.name}</h3>
                        <ul className="space-y-1.5">
                          {plan.features.map((feature, fIdx) => (
                            <li key={fIdx} className="flex items-start gap-2 text-gray-400 text-xs">
                              <span className="text-purple-400 mt-0.5">✓</span>
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Right: Price & Button */}
                      <div className="flex flex-col items-end gap-3 ml-4">
                        <div className="text-right">
                          <div className="text-3xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 text-transparent bg-clip-text">
                            ${plan.price}
                          </div>
                          <div className="text-xs text-gray-500">{plan.period}</div>
                        </div>
                        <button
                          onClick={() => navigate('/register')}
                          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-pink-500 text-white text-sm font-semibold rounded-lg transition-all shadow-md"
                        >
                          Get Started
                        </button>
                      </div>
                    </div>

                    {/* Decorative glow */}
                    <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-gradient-to-tl from-purple-500/10 to-pink-500/10 rounded-full blur-2xl opacity-0 group-hover/card:opacity-100 transition-opacity" />
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Decorative Glow */}
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity" />
          </motion.div>

          {/* RIGHT SIDE - Savings Made Simple with Live Monitoring */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl p-8 md:p-10 hover:border-purple-500/30 transition-all duration-300 group flex flex-col"
          >
            {/* Gradient Overlay on Hover */}
            <div className="absolute inset-0 bg-gradient-to-bl from-pink-500/0 via-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
            
            <div className="relative z-10 flex-1 flex flex-col">
              {/* Header */}
              <div className="mb-8">
                <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight bg-gradient-to-r from-pink-100 via-purple-100 to-white text-transparent bg-clip-text">
                  Savings Made Simple
                </h2>
                <p className="text-gray-300 text-base md:text-lg leading-relaxed">
                  Manage your expenses effectively with automated tracking, personalized insights, and smart planning.
                </p>
              </div>

              {/* Features List */}
              <div className="space-y-4 mb-8">
                {monitoringFeatures.map((feature, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-4 group/item hover:translate-x-2 transition-transform"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center text-2xl group-hover/item:scale-110 transition-transform border border-white/10 backdrop-blur-sm shadow-lg">
                      {feature.icon}
                    </div>
                    <span className={`${feature.color} text-sm md:text-base font-medium`}>{feature.text}</span>
                  </motion.div>
                ))}
              </div>

              {/* Live Financial Card */}
              <div className="relative bg-gradient-to-br from-purple-900/20 via-purple-800/10 to-transparent rounded-2xl p-6 border border-purple-500/20 backdrop-blur-sm flex-1">
                {/* Card Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-white text-xl">💰</span>
                    </div>
                    <span className="text-purple-200 font-semibold">Live Monitoring</span>
                  </div>
                  <span className="text-gray-400 text-xs uppercase tracking-wider">VISA</span>
                </div>

                {/* Balance Display */}
                <div className="mb-6">
                  <div className="text-gray-400 text-xs mb-2 uppercase tracking-wider">Current Balance</div>
                  <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-200 to-pink-200 text-transparent bg-clip-text mb-1">
                    $40,500.80
                  </div>
                  <div className="flex items-center gap-2 text-xs text-purple-300">
                    <span>BDM</span>
                    <span className="w-1 h-1 bg-purple-400 rounded-full" />
                    <span>Cards</span>
                  </div>
                </div>

                {/* Status Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-purple-900/10 backdrop-blur-sm rounded-xl p-3 border border-purple-500/10">
                    <div className="text-xs text-gray-400 mb-1">Monthly Spend</div>
                    <div className="text-lg font-bold text-purple-200">$2,340</div>
                  </div>
                  <div className="bg-purple-900/10 backdrop-blur-sm rounded-xl p-3 border border-purple-500/10">
                    <div className="text-xs text-gray-400 mb-1">Savings</div>
                    <div className="text-lg font-bold text-pink-200">$8,500</div>
                  </div>
                  <div className="col-span-2 bg-purple-900/10 backdrop-blur-sm rounded-xl p-3 border border-purple-500/10">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Status</span>
                      <span className="text-green-400 flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        Active
                      </span>
                    </div>
                  </div>
                </div>

                {/* Decorative Glow */}
                <div className="absolute top-4 right-4 w-32 h-32 bg-gradient-to-bl from-purple-500/20 to-pink-500/20 rounded-full blur-3xl" />
              </div>
            </div>

            {/* Decorative Glow */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-gradient-to-tl from-pink-500/20 to-transparent rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity" />
          </motion.div>

        </div>

      </div>
    </section>
  );
};

// --- Work Section Component (New) ---
const demoItems = [
  {
    link: "#connect",
    text: "Connect",
    description: "Link your accounts or manually track income & expenses to begin data collection.",
    icon: Link, 
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop"
  },
  {
    link: "#learn",
    text: "Learn",
    description: "Our AI analyzes your spending and saving patterns over 2-4 weeks to build your financial profile.",
    icon: Brain,
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop"
  },
  {
    link: "#adapt",
    text: "Adapt",
    description: "Receive personalized, actionable insights and tailored recommendations to optimize your finances.",
    icon: TrendingUp,
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop&sat=20"
  },
  {
    link: "#thrive",
    text: "Thrive",
    description: "Implement the strategies and watch your financial confidence, security, and wealth grow.",
    icon: Zap,
    image: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=600&h=400&fit=crop"
  }
];

// FlowingMenu Component
function FlowingMenu({ items }) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="relative h-full w-full flex">
      {/* Left Side - Menu Items */}
      <div className="w-full md:w-2/5 p-8 flex flex-col justify-center space-y-4 relative z-10">
        {items.map((item, index) => {
          const IconComponent = item.icon;
          return (
            <motion.div
              key={index}
              onClick={() => setActiveIndex(index)}
              whileHover={{ x: 8 }}
              className={`
                cursor-pointer p-4 rounded-2xl transition-all duration-300
                ${activeIndex === index 
                  ? 'bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/40' 
                  : 'bg-white/5 border border-white/10 hover:bg-white/10'
                }
              `}
            >
              <div className="flex items-center gap-4">
                <div className={`
                  p-3 rounded-xl transition-all duration-300
                  ${activeIndex === index 
                    ? 'bg-gradient-to-br from-purple-500 to-blue-500 text-white' 
                    : 'bg-white/10 text-gray-400'
                  }
                `}>
                  <IconComponent className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className={`
                    text-lg font-bold transition-colors duration-300
                    ${activeIndex === index ? 'text-white' : 'text-gray-400'}
                  `}>
                    {item.text}
                  </h3>
                  <AnimatePresence mode="wait">
                    {activeIndex === index && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-sm text-gray-300 mt-2"
                      >
                        {item.description}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Right Side - Image Display */}
      <div className="hidden md:block w-3/5 relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            <div className="relative h-full w-full p-8 flex items-center justify-center">
              <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                <img
                  src={items[activeIndex].image}
                  alt={items[activeIndex].text}
                  className="w-full h-full object-cover"
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                
                {/* Text Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <div className="flex items-center gap-3 mb-3">
                    {React.createElement(items[activeIndex].icon, {
                      className: "w-8 h-8 text-purple-400"
                    })}
                    <h3 className="text-3xl font-bold text-white">
                      {items[activeIndex].text}
                    </h3>
                  </div>
                  <p className="text-gray-200 text-lg">
                    {items[activeIndex].description}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress Indicator */}
      <div className="absolute bottom-6 left-8 flex gap-2 z-20">
        {items.map((_, index) => (
          <motion.div
            key={index}
            onClick={() => setActiveIndex(index)}
            className={`
              h-1.5 rounded-full cursor-pointer transition-all duration-300
              ${activeIndex === index ? 'w-12 bg-purple-500' : 'w-8 bg-white/30'}
            `}
          />
        ))}
      </div>
    </div>
  );
}

// Main Work Component
function Work() {
  return (
    <section id="how-it-works" className="relative py-24 px-4 bg-gradient-to-b from-[#0f0b1f] via-[#0a0a0f] to-[#050208] text-white overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Subtitle */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-sm font-bold tracking-[0.25em] text-purple-400 uppercase text-center mb-4"
        >
          The Process
        </motion.p>

        {/* Main Heading */}
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-4xl lg:text-5xl font-extrabold tracking-tighter text-center mb-16"
        >
          Your path to 
          <span className="bg-gradient-to-r from-purple-400 via-pink-300 to-purple-300 bg-clip-text text-transparent">
            {' '}
            mastery
          </span>
        </motion.h2>

        {/* FlowingMenu Container */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="h-[500px] md:h-[450px] relative 
                     border border-white/10 bg-white/[0.03] 
                     rounded-[2.5rem] 
                     overflow-hidden 
                     shadow-[0_40px_120px_rgba(124,58,237,0.3)] backdrop-blur-2xl
                     hover:border-purple-400/30 transition-all duration-500 group"
        >
          {/* Gradient Overlay on Hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/[0.08] via-transparent to-pink-500/[0.08] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          
          {/* Accent Element */}
          <div className="pointer-events-none absolute inset-x-0 -top-40 h-64 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-purple-600/20 to-blue-600/20 opacity-50" />

          {/* FlowingMenu */}
          <FlowingMenu items={demoItems} />
        </motion.div>
        
        {/* Footer Text */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-center mt-16"
        >
          <p className="text-xl md:text-2xl font-semibold text-gray-300 max-w-2xl mx-auto">
            Ready to take control of your financial future? We'll guide you step-by-step.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

// --- Main Page Assembly ---
const LandingPage = () => {
  return (
    <main className="min-h-screen bg-[#0a0a0a] selection:bg-purple-500 selection:text-white">
      <HeroSection />
      <InfoSection />
      <StatsAndCTA />
      <Work />
    </main>
  );
};

export default LandingPage;
