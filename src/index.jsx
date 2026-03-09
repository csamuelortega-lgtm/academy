import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { createRoot } from 'react-dom/client';

import 'onsenui/css/onsenui.css';
import 'onsenui/css/onsen-css-components.css';

import './style.css'

import Editor from './editor'
import Home from './home'
import HomeSostenibilidad from './HomeSostenibilidad'
import HomeExperiencias from './HomeExperiencias'

import Test from './editor/test/001/index.jsx'


const root = createRoot(document.getElementById("app"));

const Layout = () => {
  return (
    <div>

          <BrowserRouter>
            <Routes>
              <Route
                path="/"
                element={<Editor />}
              />
              <Route path="/home" element={<Home />} />
              <Route path="/home-sostenibilidad" element={<HomeSostenibilidad />} />
              <Route path="/home-experiencias" element={<HomeExperiencias />} />
              <Route path="/test/*" element={<Test />} />
            </Routes>
          </BrowserRouter>
    </div>
  );
};

root.render(<Layout />);
