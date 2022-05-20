import React from "react";
import ReactDOM from "react-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./scss/index.scss";
import LoadingContainer from "./LoadingContainer";
import { MoralisProvider } from "react-moralis";

ReactDOM.render(
  <MoralisProvider
    serverUrl="https://1dh8jmgh7yfy.usemoralis.com:2053/server"
    appId="ZgN6S3Ma803RrqEbFFj1nnoC7Sc2nw4cskEECwrm"
  >
    <LoadingContainer />
  </MoralisProvider>,
  document.getElementById("root")
);
