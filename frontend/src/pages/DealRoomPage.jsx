import React from "react";
import { useParams } from "react-router-dom";

export default function DealRoomPage() {
  const { id } = useParams();
  return (
    <div className="max-w-3xl mx-auto px-5 py-8">
      <h1 className="text-xl font-bold text-ink-primary mb-4">Deal Room #{id}</h1>
      <p className="text-ink-muted text-sm">[TODO: PRODUCT / SELLER / BUYER / NEGOTIATION THREAD / AGREED PRICE]</p>
    </div>
  );
}
