"use client";

import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

// three's own composer instead of the external postprocessing package —
// always version-matched to the installed three, which matters on fresh
// releases (r185 broke the third-party chain silently).
export default function Effects() {
  const { gl, scene, camera, size } = useThree();

  const composer = useMemo(() => {
    const c = new EffectComposer(gl);
    c.addPass(new RenderPass(scene, camera));
    c.addPass(
      new UnrealBloomPass(
        new THREE.Vector2(size.width, size.height),
        0.45, // strength
        0.6, // radius
        0.82 // luminance threshold — only hot cores bloom
      )
    );
    c.addPass(new OutputPass());
    return c;
    // size handled separately below to avoid rebuilding the whole chain
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, scene, camera]);

  useEffect(() => {
    composer.setSize(size.width, size.height);
  }, [composer, size]);

  useEffect(() => () => composer.dispose(), [composer]);

  // priority 1: replaces R3F's default render
  useFrame(() => composer.render(), 1);

  return null;
}
