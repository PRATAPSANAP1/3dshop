import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Text } from '@react-three/drei';
import * as THREE from 'three';
import { getApiUrl } from '@/lib/api';

export interface ProductBoxData {
  _id?: string;
  productName: string;
  price?: number;
  category?: string;
  imageUrl?: string;
  image?: string;
}

interface ProductBoxMeshProps {
  product: ProductBoxData;
  position: [number, number, number];
  size: [number, number, number];
  accentColor?: string;
  glow?: boolean;
  dimmed?: boolean;
  onClick?: () => void;
  showLabel?: boolean;
}

function resolveProductImageUrl(rawUrl?: string): string | null {
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) return null;
  const trimmed = rawUrl.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }
  const base = getApiUrl().replace(/\/api\/?$/, '');
  return `${base}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
}

/**
 * Generates a crisp retail package fallback texture when a product has no imageUrl
 * or when an external image URL blocks WebGL CORS access.
 */
function createFallbackPackageTexture(product: ProductBoxData, accentColor: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Clean white packaging background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 256, 256);

    // Top accent header band
    ctx.fillStyle = accentColor;
    ctx.fillRect(0, 0, 256, 54);

    // Category pill text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText((product.category || 'ITEM').toUpperCase().slice(0, 14), 128, 34);

    // Center badge circle
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(128, 126, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = accentColor;
    ctx.stroke();

    // Product initials
    const initials = (product.productName || 'P')
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() || '')
      .join('');
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 32px sans-serif';
    ctx.fillText(initials || 'P', 128, 138);

    // Product name
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 20px sans-serif';
    const label = (product.productName || 'Product').slice(0, 16);
    ctx.fillText(label, 128, 204);

    // Price tag
    if (product.price !== undefined) {
      ctx.fillStyle = accentColor;
      ctx.font = '900 22px sans-serif';
      ctx.fillText(`₹${product.price}`, 128, 236);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export const ProductBoxMesh: React.FC<ProductBoxMeshProps> = ({
  product,
  position,
  size,
  accentColor = '#f97316',
  glow = false,
  dimmed = false,
  onClick,
  showLabel = true,
}) => {
  const [imageTexture, setImageTexture] = useState<THREE.Texture | null>(null);
  const highlightRef = useRef<THREE.MeshStandardMaterial>(null);

  const resolvedUrl = useMemo(
    () => resolveProductImageUrl(product?.imageUrl || product?.image),
    [product?.imageUrl, product?.image]
  );

  const fallbackTexture = useMemo(
    () => createFallbackPackageTexture(product, accentColor),
    [product?.productName, product?.category, product?.price, accentColor]
  );

  useEffect(() => {
    if (!resolvedUrl) {
      setImageTexture(null);
      return;
    }
    let active = true;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    loader.load(
      resolvedUrl,
      (tex) => {
        if (active) {
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.minFilter = THREE.LinearFilter;
          tex.magFilter = THREE.LinearFilter;
          setImageTexture(tex);
        }
      },
      undefined,
      () => {
        if (active) setImageTexture(null);
      }
    );
    return () => {
      active = false;
    };
  }, [resolvedUrl]);

  useEffect(() => {
    return () => {
      fallbackTexture.dispose();
    };
  }, [fallbackTexture]);

  useFrame(({ clock }) => {
    if (highlightRef.current && glow) {
      highlightRef.current.emissiveIntensity = 0.8 + Math.sin(clock.getElapsedTime() * 5) * 0.5;
    }
  });

  const activeTexture = imageTexture || fallbackTexture;
  const boxTint = dimmed ? '#334155' : '#ffffff';

  return (
    <group
      position={position}
      onClick={
        onClick
          ? (e) => {
              e.stopPropagation();
              onClick();
            }
          : undefined
      }
      onPointerOver={
        onClick
          ? (e) => {
              e.stopPropagation();
              document.body.style.cursor = 'pointer';
            }
          : undefined
      }
      onPointerOut={
        onClick
          ? () => {
              document.body.style.cursor = 'auto';
            }
          : undefined
      }
    >
      {/* Main product box with product image mapped directly on faces */}
      <Box args={size} castShadow receiveShadow>
        <meshStandardMaterial
          map={activeTexture}
          color={boxTint}
          roughness={0.35}
          metalness={0.05}
          transparent={dimmed}
          opacity={dimmed ? 0.22 : 1}
        />
      </Box>

      {/* Glowing selection/search halo frame without obscuring the product image */}
      {glow && (
        <Box args={[size[0] + 0.04, size[1] + 0.04, size[2] + 0.04]}>
          <meshStandardMaterial
            ref={highlightRef}
            color="#22c55e"
            emissive="#22c55e"
            emissiveIntensity={1}
            wireframe
          />
        </Box>
      )}

      {/* Crisp product name label above box */}
      {showLabel && (
        <Text
          position={[0, size[1] / 2 + 0.06, size[2] / 2 + 0.02]}
          fontSize={0.095}
          color={dimmed ? '#64748b' : '#f8fafc'}
          outlineWidth={0.012}
          outlineColor="#0f172a"
          fontWeight="bold"
          anchorX="center"
          anchorY="bottom"
          maxWidth={size[0] * 1.4}
        >
          {product?.productName || ''}
        </Text>
      )}
    </group>
  );
};
