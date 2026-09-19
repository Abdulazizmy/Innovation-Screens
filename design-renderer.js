/* =========================================================
   Innovation Screens — Design Renderer
   محرك عرض التصميمات (خلفيات متحركة + شعارات + نصوص + صور)
   يُستخدم في: لوحة التحكم (المصمم) وشاشة العرض (screen.html)
========================================================= */
(function (global) {
  "use strict";

  function uid() {
    return "L" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  /* ---------- Default layer factories ---------- */
  function baseLayer(type, overrides) {
    return Object.assign(
      {
        id: uid(),
        type,
        name: "",
        x: 10,
        y: 10,
        w: 30,
        h: 12,
        rotation: 0,
        opacity: 1,
        zIndex: 1,
        visible: true,
        locked: false,
      },
      overrides || {}
    );
  }

  function createLayer(type) {
    switch (type) {
      case "bg-color":
        return baseLayer("bg-color", {
          name: "خلفية لونية",
          x: 0, y: 0, w: 100, h: 100, zIndex: 0,
          color: "#0b0912",
        });
      case "bg-gradient":
        return baseLayer("bg-gradient", {
          name: "خلفية متدرجة",
          x: 0, y: 0, w: 100, h: 100, zIndex: 0,
          colorFrom: "#2A206A", colorTo: "#852CD0", angle: 135,
        });
      case "bg-image":
        return baseLayer("bg-image", {
          name: "خلفية صورة",
          x: 0, y: 0, w: 100, h: 100, zIndex: 0,
          src: "",
        });
      case "bg-animated":
        return baseLayer("bg-animated", {
          name: "خلفية متحركة",
          x: 0, y: 0, w: 100, h: 100, zIndex: 1,
          animKind: "stars",
          animColor: "#852CD0",
          animColor2: "#1D9AF2",
          density: 50,
          speed: 30,
          size: 40,
        });
      case "hub-logo":
        return baseLayer("hub-logo", {
          name: "شعار المركز",
          x: 35, y: 30, w: 30, h: 20, zIndex: 5,
          src: "",
          monochrome: false,
          glow: false,
          glowColor: "#852CD0",
        });
      case "partner-logo":
        return baseLayer("partner-logo", {
          name: "شعار شريك",
          x: 40, y: 70, w: 20, h: 12, zIndex: 5,
          src: "",
          monochrome: false,
          glow: false,
          glowColor: "#1D9AF2",
        });
      case "text":
        return baseLayer("text", {
          name: "نص",
          x: 10, y: 50, w: 80, h: 10, zIndex: 6,
          text: "حياكم الله",
          fontFamily: "Arial, 'Segoe UI', Tahoma, sans-serif",
          fontSize: 6,
          fontWeight: 700,
          color: "#ffffff",
          align: "center",
          letterSpacing: 0,
          shadow: true,
          glow: false,
          glowColor: "#852CD0",
        });
      case "image":
        return baseLayer("image", {
          name: "صورة",
          x: 25, y: 25, w: 50, h: 30, zIndex: 4,
          src: "",
          radius: 0,
        });
      default:
        return baseLayer(type, {});
    }
  }

  /* ---------- Particle / animated background engine ---------- */
  function startParticleAnimation(canvasEl, opts) {
    let cfg = Object.assign(
      { kind: "stars", color: "#852CD0", color2: "#1D9AF2", density: 50, speed: 30, size: 40, opacity: 1 },
      opts || {}
    );
    const ctx = canvasEl.getContext("2d");
    let raf = null;
    let particles = [];
    let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);

    function sizePx() {
      const rect = canvasEl.getBoundingClientRect();
      w = Math.max(1, Math.round(rect.width));
      h = Math.max(1, Math.round(rect.height));
      canvasEl.width = w * dpr;
      canvasEl.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function makeParticles() {
      const area = (w * h) / (1280 * 720);
      const countBase = cfg.kind === "glow" ? 4 : cfg.kind === "lines" ? 45 : 60;
      const count = Math.max(6, Math.round(countBase * (0.25 + cfg.density / 100) * Math.max(0.4, area)));
      const speedFactor = 0.15 + (cfg.speed / 100) * 1.6;
      const sizeFactor = 0.5 + (cfg.size / 100) * 2.2;
      particles = new Array(count).fill(0).map(() => {
        const baseR = cfg.kind === "glow" ? 40 + Math.random() * 60 : 1 + Math.random() * 2.2;
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * speedFactor,
          vy: (Math.random() - 0.5) * speedFactor,
          r: baseR * sizeFactor,
          phase: Math.random() * Math.PI * 2,
          c: Math.random() > 0.5 ? cfg.color : cfg.color2,
        };
      });
    }

    function hexToRgba(hex, a) {
      const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || "#ffffff");
      if (!m) return `rgba(255,255,255,${a})`;
      return `rgba(${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)},${a})`;
    }

    function step(t) {
      ctx.clearRect(0, 0, w, h);
      ctx.globalAlpha = cfg.opacity;
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < -20) p.x = w + 20; if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20; if (p.y > h + 20) p.y = -20;
      }
      if (cfg.kind === "stars") {
        for (const p of particles) {
          const tw = 0.4 + 0.6 * Math.abs(Math.sin(t / 900 + p.phase));
          ctx.beginPath();
          ctx.fillStyle = hexToRgba(p.c, tw);
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (cfg.kind === "dots") {
        for (const p of particles) {
          ctx.beginPath();
          ctx.fillStyle = hexToRgba(p.c, 0.85);
          ctx.shadowColor = p.c;
          ctx.shadowBlur = p.r * 3;
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.shadowBlur = 0;
      } else if (cfg.kind === "lines") {
        for (const p of particles) {
          ctx.beginPath();
          ctx.fillStyle = hexToRgba(p.c, 0.9);
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
        const maxDist = 130 * (0.5 + cfg.size / 100);
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const a = particles[i], b = particles[j];
            const dx = a.x - b.x, dy = a.y - b.y;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < maxDist) {
              ctx.strokeStyle = hexToRgba(cfg.color, (1 - d / maxDist) * 0.5);
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
            }
          }
        }
      } else if (cfg.kind === "glow") {
        for (const p of particles) {
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
          g.addColorStop(0, hexToRgba(p.c, 0.55));
          g.addColorStop(1, hexToRgba(p.c, 0));
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(step);
    }

    sizePx();
    makeParticles();
    raf = requestAnimationFrame(step);

    return {
      stop() { if (raf) cancelAnimationFrame(raf); raf = null; },
      resize() { sizePx(); },
      update(newOpts) {
        const densityOrSizeChanged =
          newOpts.density !== undefined && newOpts.density !== cfg.density ||
          newOpts.kind !== undefined && newOpts.kind !== cfg.kind ||
          newOpts.size !== undefined && newOpts.size !== cfg.size;
        cfg = Object.assign(cfg, newOpts);
        if (densityOrSizeChanged) makeParticles();
      },
    };
  }

  /* ---------- Layer DOM builder ---------- */
  function pxFontSize(layer, canvasPxHeight) {
    return Math.max(8, (Number(layer.fontSize) || 5) / 100 * canvasPxHeight);
  }

  function applyCommonStyle(node, layer) {
    node.style.position = "absolute";
    node.style.left = layer.x + "%";
    node.style.top = layer.y + "%";
    node.style.width = layer.w + "%";
    node.style.height = layer.h + "%";
    node.style.transform = `rotate(${layer.rotation || 0}deg)`;
    node.style.opacity = layer.visible === false ? 0 : (layer.opacity == null ? 1 : layer.opacity);
    node.style.zIndex = layer.zIndex || 1;
    node.style.boxSizing = "border-box";
  }

  function buildLayerNode(layer, canvasEl, registerAnimation) {
    const node = document.createElement("div");
    node.className = "dr-layer dr-layer-" + layer.type;
    node.dataset.layerId = layer.id;
    applyCommonStyle(node, layer);

    if (layer.type === "bg-color") {
      node.style.background = layer.color || "#000";
    } else if (layer.type === "bg-gradient") {
      node.style.background = `linear-gradient(${layer.angle || 135}deg, ${layer.colorFrom}, ${layer.colorTo})`;
    } else if (layer.type === "bg-image") {
      node.style.backgroundImage = layer.src ? `url("${layer.src}")` : "none";
      node.style.backgroundSize = "cover";
      node.style.backgroundPosition = "center";
      node.style.background = node.style.backgroundImage === "none" ? "#111" : node.style.background;
    } else if (layer.type === "bg-animated") {
      const canvas = document.createElement("canvas");
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      canvas.style.display = "block";
      node.appendChild(canvas);
      const handle = startParticleAnimation(canvas, {
        kind: layer.animKind, color: layer.animColor, color2: layer.animColor2,
        density: layer.density, speed: layer.speed, size: layer.size, opacity: 1,
      });
      if (registerAnimation) registerAnimation(layer.id, handle, canvas);
    } else if (layer.type === "hub-logo" || layer.type === "partner-logo" || layer.type === "image") {
      const img = document.createElement("img");
      img.src = layer.src || "";
      img.alt = layer.name || "";
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "contain";
      img.style.borderRadius = (layer.radius || 0) + "px";
      let filter = "";
      if (layer.monochrome) filter += "grayscale(1) brightness(1.4) ";
      if (layer.glow) filter += `drop-shadow(0 0 ${Math.max(4, (layer.w || 20) * 0.25)}px ${layer.glowColor || "#852CD0"}) `;
      img.style.filter = filter.trim();
      if (!layer.src) {
        node.style.display = "flex";
        node.style.alignItems = "center";
        node.style.justifyContent = "center";
        node.style.border = "2px dashed rgba(255,255,255,.25)";
        node.style.borderRadius = "10px";
        node.style.color = "rgba(255,255,255,.55)";
        node.style.fontSize = "12px";
        node.textContent = layer.type === "hub-logo" ? "🏛️ شعار المركز" : layer.type === "partner-logo" ? "🤝 شعار الشريك" : "🖼️ صورة";
      } else {
        node.appendChild(img);
      }
    } else if (layer.type === "text") {
      node.style.display = "flex";
      node.style.alignItems = "center";
      node.style.justifyContent = layer.align === "left" ? "flex-start" : layer.align === "right" ? "flex-end" : "center";
      const span = document.createElement("div");
      span.textContent = layer.text || "";
      span.style.width = "100%";
      span.style.fontFamily = layer.fontFamily || "Arial, sans-serif";
      span.style.fontWeight = layer.fontWeight || 700;
      span.style.color = layer.color || "#fff";
      span.style.textAlign = layer.align || "center";
      span.style.letterSpacing = (layer.letterSpacing || 0) + "px";
      span.style.whiteSpace = "pre-wrap";
      const canvasRect = canvasEl.getBoundingClientRect();
      span.style.fontSize = pxFontSize(layer, canvasRect.height || canvasEl.clientHeight || 800) + "px";
      let ts = "";
      if (layer.shadow) ts += "0 2px 10px rgba(0,0,0,.55)";
      if (layer.glow) ts += (ts ? ", " : "") + `0 0 18px ${layer.glowColor || "#852CD0"}`;
      if (ts) span.style.textShadow = ts;
      node.appendChild(span);
    }
    return node;
  }

  /* ---------- Mount a full design into a container ---------- */
  function mount(containerEl, design, options) {
    options = options || {};
    containerEl.innerHTML = "";
    containerEl.style.position = "relative";
    containerEl.style.overflow = "hidden";
    containerEl.style.pointerEvents = options.interactive ? "auto" : "none";
    const animations = new Map();
    const nodes = new Map();
    const layers = (design.layers || []).slice().sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
    for (const layer of layers) {
      const node = buildLayerNode(layer, containerEl, (id, handle, canvasChild) => {
        animations.set(id, { handle, canvasChild });
      });
      containerEl.appendChild(node);
      nodes.set(layer.id, node);
    }
    function resizeAll() {
      animations.forEach((a) => a.handle.resize && a.handle.resize());
    }
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resizeAll) : null;
    if (ro) ro.observe(containerEl);
    window.addEventListener("resize", resizeAll);

    return {
      nodes,
      animations,
      destroy() {
        animations.forEach((a) => a.handle.stop && a.handle.stop());
        if (ro) ro.disconnect();
        window.removeEventListener("resize", resizeAll);
        containerEl.innerHTML = "";
      },
    };
  }

  global.DesignRenderer = {
    createLayer,
    uid,
    startParticleAnimation,
    buildLayerNode,
    applyCommonStyle,
    mount,
  };
})(window);
