import React, { useEffect, useRef } from "react";
import mapboxgl, { GeoJSONFeature } from "mapbox-gl";

import "mapbox-gl/dist/mapbox-gl.css";
import { MAP_BOX_ACCESS_TOKEN } from "./config/settigns";
import { CountryPolygonData } from "./config/world-map-data";

const worldData = CountryPolygonData;
const countryPointData: GeoJSON.GeoJSON = {
  ...CountryPolygonData,
  // @ts-ignore
  features: CountryPolygonData?.features?.map((feature, index) => {
    return {
      ...feature,
      id: index,
      geometry: { type: "Point", coordinates: [feature?.properties?.longitude, feature?.properties?.latitude] },
    };
  }),
};

export const worldGeoJson: GeoJSON.GeoJSON = {
  ...worldData,
  // @ts-ignore
  features: worldData.features?.map((x, index) => ({ ...x, id: index })),
};

export const getTooltipNode = (feature: GeoJSONFeature) => {
  if (feature)
    return `<div style="display:flex;flex-direction:column;row-gap:6px;">
  <p>Name: ${feature?.properties?.name}</p>
  <p>Area: ${feature?.properties?.m1}</p>
  <p>Population: ${feature?.properties?.m2}</p>
  </div>`;
  else return "";
};

const WorldMapChart = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef?.current) return;
    // set access token
    mapboxgl.accessToken = MAP_BOX_ACCESS_TOKEN;

    // initialize map
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef?.current,
      style: "mapbox://styles/mapbox/streets-v12",
      // center: [worldData.features[0].geometry.coordinates[0][0][0], worldData.features[0].geometry.coordinates[0][0][1]],
      center: [-59.78759765624997, 43.939599609374994],
      zoom: 1.5,
    });

    if (!mapRef.current) return;

    let hoveredPolygonId: any;
    let selectedPolygonId: any;

    const tooltip = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
    });

    // load map
    mapRef.current.on("load", () => {
      mapRef.current?.addSource("countries", {
        type: "geojson",
        data: worldGeoJson,
      });
      mapRef.current?.addSource("bubble", {
        type: "geojson",
        data: countryPointData,
      });

      mapRef.current?.addLayer({
        id: "countries-fills",
        type: "fill",
        source: "countries",
        layout: {},
        paint: {
          "fill-color": [
            "match",
            ["get", "name"],
            ...worldData.features.flatMap((feature) => [feature.properties.name, feature.properties.color]),
            "#ccc", // fallback color if no match is found
          ],
          "fill-opacity": 0.7,
        },
      });

      mapRef.current?.addLayer({
        id: "countries-borders",
        type: "line",
        source: "countries",
        layout: {},
        paint: {
          "line-width": 2,
          "line-color": [
            "match",
            ["get", "name"],
            ...worldData.features.flatMap((feature) => [feature.properties.name, feature.properties.color]),
            "#ccc", // fallback color if no match is found
          ],
          "fill-opacity": 0.7,
        },
      });
      // Add a circle layer to represent population bubbles
      mapRef.current?.addLayer({
        id: "population-bubbles",
        type: "circle",
        source: "bubble",
        paint: {
          "circle-radius": 25,
          "circle-color": "#007E91", // Color for the bubbles
          "circle-opacity": 0.5, // Opacity of the circles
          "circle-stroke-color": "#007E91",
          "circle-stroke-width": 1,
        },
      });

      mapRef.current?.on("mousemove", "countries-fills", (e) => {
        if (e.features && e.features.length > 0) {
          if (hoveredPolygonId) {
            mapRef.current?.setFeatureState({ source: "countries", id: hoveredPolygonId }, { hover: false });
          }

          hoveredPolygonId = e.features[0].id;
          if (hoveredPolygonId) {
            mapRef.current?.setFeatureState({ source: "countries", id: hoveredPolygonId }, { hover: true });
          }

          // Set the tooltip content and position
          tooltip
            .setLngLat(e.lngLat)
            .setHTML(getTooltipNode(e.features[0])) // Change property name as appropriate
            .addTo(mapRef.current!);
        }
      });

      // mapRef.current?.on("click", "countries-fills", (e) => {
      //   if (e.features && e.features.length > 0) {
      //     if (selectedPolygonId) selectedPolygonId = null;
      //     else {
      //       selectedPolygonId = e.features[0].id;
      //       mapRef?.current?.setFeatureState({ source: "countries", id: selectedPolygonId }, {});
      //     }
      //   }
      // });

      mapRef.current?.on("mouseleave", "countries-fills", () => {
        if (hoveredPolygonId !== null) {
          mapRef.current?.setFeatureState({ source: "countries", id: hoveredPolygonId }, { hover: false });
        }
        // Remove the tooltip
        tooltip.remove();
        hoveredPolygonId = null;
      });
    });
    // mapRef.current.scrollZoom.disable();
    return () => mapRef.current?.remove();
  }, []);

  return (
    <div id="map" ref={mapContainerRef} style={{ height: "600px", width: "1200px", margin: "50px auto" }}>
      WorldMap
    </div>
  );
};

export default WorldMapChart;
