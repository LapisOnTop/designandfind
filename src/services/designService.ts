import { supabase } from "@/integrations/supabase/client";
import type { fabric } from "fabric";

export interface SerializedDesign {
  id?: string;
  user_id?: string;
  product_type: string;
  side: string;
  canvas_json: any;
  created_at?: string;
  updated_at?: string;
}

const localKey = (productType: string, side: string, userId?: string | null) =>
  `designMatch_design_${userId || "guest"}_${productType}_${side}`;

export const serializeCanvas = (canvas: fabric.Canvas) => {
  return canvas.toJSON(["name", "opacity", "selectable", "evented", "flipX", "flipY"]);
};

export const saveDesign = async (params: {
  canvas: fabric.Canvas;
  productType: string;
  side: string;
  userId?: string | null;
}) => {
  const { canvas, productType, side, userId } = params;
  const canvas_json = serializeCanvas(canvas);
  const payload: SerializedDesign = {
    product_type: productType,
    side,
    canvas_json,
    user_id: userId || undefined,
  };

  // Local fallback (always)
  localStorage.setItem(localKey(productType, side, userId), JSON.stringify(payload));

  // Supabase sync when user is known
  if (userId) {
    const { error } = await supabase.from("designs" as any).upsert(
      {
        user_id: userId,
        product_type: productType,
        side,
        canvas_json,
      } as any,
      { onConflict: "user_id,product_type,side" } as any
    );
    if (error) {
      console.error("Failed to save design to Supabase", error);
    }
  }

  return payload;
};

export const loadDesign = async (params: {
  productType: string;
  side: string;
  userId?: string | null;
}): Promise<SerializedDesign | null> => {
  const { productType, side, userId } = params;

  // Prefer Supabase when user is known
  if (userId) {
    const { data, error } = await supabase
      .from("designs" as any)
      .select("*")
      .eq("user_id", userId)
      .eq("product_type", productType)
      .eq("side", side)
      .maybeSingle();

    if (!error && data) {
      return data as unknown as SerializedDesign;
    }
  }

  const stored = localStorage.getItem(localKey(productType, side, userId));
  if (!stored) return null;
  try {
    return JSON.parse(stored) as SerializedDesign;
  } catch (e) {
    console.error("Failed to parse local design", e);
    return null;
  }
};

