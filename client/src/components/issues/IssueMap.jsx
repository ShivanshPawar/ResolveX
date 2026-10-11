import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const hasCoordinates = (latitude, longitude) =>
  Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude))

function MapSync({ latitude, longitude }) {
  const map = useMap()
  const prev = useRef(null)
  useEffect(() => {
    if (hasCoordinates(latitude, longitude)) {
      const lat = Number(latitude)
      const lng = Number(longitude)
      const key = `${lat.toFixed(5)},${lng.toFixed(5)}`
      if (key !== prev.current) {
        map.flyTo([lat, lng], 15, { duration: 1 })
        prev.current = key
      }
    }
  }, [latitude, longitude, map])
  return null
}

function ClickHandler({ onSelect }) {
  useMapEvents({ click: (e) => onSelect(e.latlng.lat, e.latlng.lng) })
  return null
}

export function IssueMap({ latitude, longitude, title }) {
  if (!hasCoordinates(latitude, longitude)) return null
  const lat = Number(latitude)
  const lng = Number(longitude)
  return (
    <div
      className="h-52 sm:h-64 rounded-xl overflow-hidden border border-slate-200 "
      style={{ zIndex: 1 }}
    >
      <MapContainer center={[lat, lng]} zoom={15} className="h-full w-full" scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]}>
          <Popup>
            <span className="block max-w-48 break-words">{title}</span>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  )
}

export function LocationPicker({ latitude, longitude, onSelect }) {
  const hasSelectedLocation = hasCoordinates(latitude, longitude)
  const lat = Number(latitude)
  const lng = Number(longitude)
  const center = hasSelectedLocation ? [lat, lng] : [20.5937, 78.9629]
  return (
    <div
      className="h-52 sm:h-64 rounded-xl overflow-hidden border border-slate-200 "
      style={{ zIndex: 1 }}
    >
      <MapContainer center={center} zoom={hasSelectedLocation ? 14 : 5} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onSelect={onSelect} />
        {hasSelectedLocation && (
          <>
            <MapSync latitude={lat} longitude={lng} />
            <Marker position={[lat, lng]}>
              <Popup>Issue location</Popup>
            </Marker>
          </>
        )}
      </MapContainer>
    </div>
  )
}
