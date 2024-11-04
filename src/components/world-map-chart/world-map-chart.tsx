import React, { useEffect, useRef } from "react";
import mapboxgl, { GeoJSONFeature } from "mapbox-gl";

import "mapbox-gl/dist/mapbox-gl.css";
import { MAP_BOX_ACCESS_TOKEN } from "./config/settigns";
import { DummyData } from "./config/dummy-data";

export const DummGeoJson: GeoJSON.GeoJSON = {
  ...DummyData,
  // @ts-ignore
  features: DummyData.features?.map((x, index) => ({ ...x, id: index })),
};

export const getTooltipNode = (feature: GeoJSONFeature) => {
  if (feature)
    return `<div style="display:flex;flex-direction:column;row-gap:6px;">
  <p>ISO: ${feature?.properties?.ISO}</p>
  <p>NAME_1: ${feature?.properties?.NAME_1}</p>
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
      center: [DummyData.features[0].geometry.coordinates[0][0][0], DummyData.features[0].geometry.coordinates[0][0][1]],
      zoom: 3,
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
        data: DummGeoJson,
      });

      // The feature-state dependent fill-opacity expression will render the hover effect
      // when a feature's hover state is set to true.
      mapRef.current?.addLayer({
        id: "countries-fills",
        type: "fill",
        source: "countries",
        layout: {},
        paint: {
          "fill-color": "#627BC1",
          "fill-opacity": ["case", ["boolean", ["feature-state", "hover"], false], 1, 0.5],
        },
      });

      mapRef.current?.addLayer({
        id: "countries-borders",
        type: "line",
        source: "countries",
        layout: {},
        paint: { "line-color": "#627BC1", "line-width": 2 },
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

    return () => mapRef.current?.remove();
  }, []);

  return (
    <div id="map" ref={mapContainerRef} style={{ height: "600px", width: "800px" }}>
      WorldMap
    </div>
  );
};

export default WorldMapChart;
