"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  ZoomControl,
  LayersControl,
} from "react-leaflet";
import { useEffect } from "react";

// Fix for default marker icons in Leaflet
const DefaultIcon = new Icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

type MapModalProps = {
  location: { lat: number; lng: number };
  onClose: () => void;
};

// Component to handle map center updates
const MapUpdater = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
};

export default function MapModal({ location, onClose }: MapModalProps) {
  // Important: MapContainer needs explicit dimensions
  const mapStyle = {
    height: "400px",
    width: "100%",
  };

  return (
    <Dialog open={!!location} onOpenChange={onClose}>
      <DialogContent className='flex flex-col items-center justify-center max-w-[600px]'>
        <DialogTitle className='text-lg font-bold mb-2'>
          Installation Location
        </DialogTitle>

        {/* Map Container - must have explicit height/width */}
        <div style={mapStyle} className='rounded-md'>
          <MapContainer
            center={[location.lat, location.lng]}
            zoom={5}
            style={mapStyle}
            zoomControl={false}
          >
            <LayersControl position='topright'>
              <LayersControl.BaseLayer checked name='OpenStreetMap'>
                <TileLayer
                  url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name='Google Maps'>
                <TileLayer
                  url='http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}'
                  subdomains={["mt0", "mt1", "mt2", "mt3"]}
                />
              </LayersControl.BaseLayer>
            </LayersControl>

            <Marker position={[location.lat, location.lng]} icon={DefaultIcon}>
              <Popup>Installation Location</Popup>
            </Marker>

            <ZoomControl position='topright' />
            <MapUpdater center={[location.lat, location.lng]} />
          </MapContainer>
        </div>

        <div className='mt-4 text-sm text-gray-600'>
          Coordinates: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
        </div>
      </DialogContent>
    </Dialog>
  );
}
