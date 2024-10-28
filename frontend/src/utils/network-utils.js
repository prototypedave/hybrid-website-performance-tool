import React from 'react';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { Tracker, BarChart } from '@tremor/react';

const defaultIcon = L.icon({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41], // Point of the icon which will correspond to marker's location
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

export const IPMap = ({ coordinates }) => {
    const defaultCenter = coordinates.length > 0 ? coordinates[0] : [20, 0];

    return (
      <MapContainer center={defaultCenter} zoom={2} style={{ height: '50vh', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        {coordinates.map((position, index) => (
          <Marker key={index} position={position} icon={defaultIcon} />
        ))}

        <Polyline positions={coordinates} color="blue" />
      </MapContainer>
    );
};

export const Table = ({ data }) => {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left">Hop</th>
              <th className="py-3 px-6 text-left">Host</th>
              <th className="py-3 px-6 text-left">Time</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm font-light">
            {data.map((row, index) => (
              <tr key={index} className="border-b border-gray-200 hover:bg-gray-100">
                <td className="py-3 px-6 text-left">{row.hop}</td>
                <td className="py-3 px-6 text-left">{row.host}</td>
                <td className="py-3 px-6 text-left text-green-600">{row.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
};

export const SSL = ({ data }) => {
    if (!data) {
        return (
            <div className="mx-auto max-w-xs">
                <p>Loading...</p>
            </div>
        );
    }
    return (
        <div className="mx-auto max-w-xs text-base">
            <p className='text-lg text-tremor-label dark:text-dark-tremor-label'>Version: <span className='ml-2 text-tremor-content dark:text-dark-tremor-content'>{data.version}</span></p>
            <p className='text-tremor-label dark:text-dark-tremor-label'>Serial Number: <span className='ml-2 text-tremor-content dark:text-dark-tremor-content'>{data.serialNumber}</span></p>
            <p className='text-tremor-label dark:text-dark-tremor-label'>Signature Algorithm: <span className='ml-2 text-tremor-content dark:text-dark-tremor-content'>{data.signatureAlgorithm}</span></p>
            <p className='text-tremor-label dark:text-dark-tremor-label'>Issuer: <span className='ml-2 text-tremor-content dark:text-dark-tremor-content'>{data.issuer}</span></p>
            <p className='text-tremor-label dark:text-dark-tremor-label'>Validity: <span className='ml-2 text-tremor-content dark:text-dark-tremor-content'>{data.validity}</span></p>
            <p className='text-tremor-label dark:text-dark-tremor-label'>Public key Algorithm: <span className='ml-2 text-tremor-content dark:text-dark-tremor-content'>{data.publicKeyAlgorithm}</span></p>
            <p className='text-tremor-label dark:text-dark-tremor-label'>RSA public key: <span className='ml-2 text-tremor-content dark:text-dark-tremor-content'>{data.rsaPublicKey}</span></p>
        </div>
    )
};

export const PingTracker = ({ data, percent, url }) => {
    return (
        <div className="mx-auto max-w-md">
            <p className="text-tremor-default flex items-center justify-between">
                <span className="text-tremor-content-strong dark:text-dark-tremor-content-strong font-medium">{url}</span>
                <span className="text-tremor-content dark:text-dark-tremor-content">uptime {percent}%</span>
            </p>
            <Tracker data={data} className="mt-2" />
        </div>
    );
}

export const PingChart = ({ data }) => {
    return (
        <div className="mx-auto max-w-4xl p-4">
            <BarChart
                data={data}
                index="time"
                categories={['latency']}
                colors={['blue']}
                valueFormatter={(value) => `${value} ms`}
                className="h-56"
                startEndOnly
                showLegend={false}
                showTooltip={false}
                xAxisLabel="24H Ping"
            />
        </div>
    )
}

export const Additional = ({title, param, link, add }) => {
    return (
        <div>
            <h3 className="mt-0 mb-0 text-center font-semibold">{title}</h3>
            <p className="text-tremor-content dark:text-dark-tremor-content">{param}<span><a a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">{add}</a></span></p>
        </div>
    )
}