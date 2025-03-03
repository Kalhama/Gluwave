# Changelog

## [1.6.1](https://github.com/Kalhama/Gluwave/compare/gluwave-v1.6.0...gluwave-v1.6.1) (2025-03-03)


### Bug Fixes

* CTE execution after upgrading to dirzzle 0.4, remove unused legacy api route ([730b3dc](https://github.com/Kalhama/Gluwave/commit/730b3dcbecbb153cb08f7934bfb022ffef5918e5))

## [1.6.0](https://github.com/Kalhama/Gluwave/compare/gluwave-v1.5.0...gluwave-v1.6.0) (2025-03-02)


### Features

* **gluwave:** Publish API as Open API ([b387843](https://github.com/Kalhama/Gluwave/commit/b387843eb5022c1746453252ce202bd2038a8934))

## [1.5.0](https://github.com/Kalhama/Gluwave/compare/gluwave-v1.4.3...gluwave-v1.5.0) (2024-10-10)


### Features

* **gluwave:** :art: progressive web app ([a70832d](https://github.com/Kalhama/Gluwave/commit/a70832d309ade15662ee854b8539862945df2b59))


### Bug Fixes

* **gluwave:** &lt;title&gt; [#180](https://github.com/Kalhama/Gluwave/issues/180) ([efe2ed5](https://github.com/Kalhama/Gluwave/commit/efe2ed504815aced03cb3474c6a9c8cd2ae913a2))
* **gluwave:** attributed_carbs should be weighed by active_time [#129](https://github.com/Kalhama/Gluwave/issues/129) ([401e7ea](https://github.com/Kalhama/Gluwave/commit/401e7ea75f11a3bea7bc754bd52a611439793abb))
* **gluwave:** build error ([56354b5](https://github.com/Kalhama/Gluwave/commit/56354b5773194c154d37c1ec26ca49e7c8776948))
* **gluwave:** Entry input datetime is in past when using previously opened tab [#185](https://github.com/Kalhama/Gluwave/issues/185) ([44f1f8c](https://github.com/Kalhama/Gluwave/commit/44f1f8c6d8c15a8b5f3c2720856102bcb5cd28d4))
* **gluwave:** Settings profile typo [#177](https://github.com/Kalhama/Gluwave/issues/177) ([8640168](https://github.com/Kalhama/Gluwave/commit/86401689c8348748c824e7004a639144da28cacf))
* **gluwave:** skeleton flicker [#181](https://github.com/Kalhama/Gluwave/issues/181) ([a012401](https://github.com/Kalhama/Gluwave/commit/a012401d9bf4c031c72d27cc5a1540488e8c7409))
* **gluwave:** Table padding [#178](https://github.com/Kalhama/Gluwave/issues/178) ([e6a90a3](https://github.com/Kalhama/Gluwave/commit/e6a90a31fcb86f9fbe52aa779d023070eb8d3ae8))

## [1.4.3](https://github.com/Kalhama/Gluwave/compare/gluwave-v1.4.2...gluwave-v1.4.3) (2024-10-09)


### Bug Fixes

* **gluwave:** cob linear interpolation ([1a0d2b2](https://github.com/Kalhama/Gluwave/commit/1a0d2b291b95e7fbc333bb8493959e0807d81177))

## [1.4.2](https://github.com/Kalhama/Gluwave/compare/gluwave-v1.4.1...gluwave-v1.4.2) (2024-10-08)


### Bug Fixes

* carbs on board is invisible if there are no glucose readings [#168](https://github.com/Kalhama/Gluwave/issues/168) ([8070dd9](https://github.com/Kalhama/Gluwave/commit/8070dd973f5d703b00ddc5c3f76096ff9cb7aa91))
* cob returns nan when carbs start on latest measurement / COB graph needs two glucose measurements for every meal before it displays meaningful data [#160](https://github.com/Kalhama/Gluwave/issues/160) ([6a78692](https://github.com/Kalhama/Gluwave/commit/6a7869222121f51bcb4bed0695822dbb378fdfa3))
* **gluwave:** :adhesive_bandage: no prediction if no recent insulin data [#172](https://github.com/Kalhama/Gluwave/issues/172) ([2d12e60](https://github.com/Kalhama/Gluwave/commit/2d12e60e18715fd084c08ecb6dc2b4ba93dc44d3))
* **gluwave:** :art: carb page padding ([ced17cc](https://github.com/Kalhama/Gluwave/commit/ced17cc83f0c25f1089039e09d67ddf20de9ef8a))
* **gluwave:** carb rate did not end at correct time ([8c2bd3d](https://github.com/Kalhama/Gluwave/commit/8c2bd3de936e557ae77f017ebf4404911f00c2f6))
* **gluwave:** glucose bar not showing value if there was no trend available ([2e67478](https://github.com/Kalhama/Gluwave/commit/2e6747844355e71b8c2a16acbc2ae84118ffa0d5))
* **gluwave:** Meal does not get attributed any carbs when metrics are sparse [#162](https://github.com/Kalhama/Gluwave/issues/162) ([6a78692](https://github.com/Kalhama/Gluwave/commit/6a7869222121f51bcb4bed0695822dbb378fdfa3))
* **gluwave:** prediction starting from wrong timestamp in certain situations ([4d66f6d](https://github.com/Kalhama/Gluwave/commit/4d66f6df80289b03fc73ead3ec9ba98d6a6f3bf8))
* **gluwave:** remove unused env var ([82385d2](https://github.com/Kalhama/Gluwave/commit/82385d201e6f6415fe64ba288fad37b6f623a729))

## [1.4.1](https://github.com/Kalhama/Gluwave/compare/gluwave-v1.4.0...gluwave-v1.4.1) (2024-10-03)


### Bug Fixes

* **gluwave:** carb rate dit not end at correct time ([a9fdef8](https://github.com/Kalhama/Gluwave/commit/a9fdef833328663a85372c0cf50b28c86e3503d1))

## [1.4.0](https://github.com/Kalhama/Gluwave/compare/gluwave-v1.3.2...gluwave-v1.4.0) (2024-10-03)


### Features

* **gluwave:** Rework carbs graph [#75](https://github.com/Kalhama/Gluwave/issues/75) ([63d1b57](https://github.com/Kalhama/Gluwave/commit/63d1b57074000f6bd330f8fbf43c0933703c67ad))
* **gluwave:** show recent entries lists ([94c12c6](https://github.com/Kalhama/Gluwave/commit/94c12c6a90315357339b10c6e1a655fbfad99905))


### Bug Fixes

* **gluwave:** :zap: improve sql query performance ([19d5524](https://github.com/Kalhama/Gluwave/commit/19d5524899f022fe1dec2dcad267164da311f76a))
* **gluwave:** Edit entry dialog does not show updated information update when opened second time [#106](https://github.com/Kalhama/Gluwave/issues/106) ([549d8e8](https://github.com/Kalhama/Gluwave/commit/549d8e82d0e24178d8e1342a7dbffd35a1ecd412))
* **gluwave:** entry delete loading icon not visible ([192447f](https://github.com/Kalhama/Gluwave/commit/192447f5c520779d90445bb5249ec408573811aa))
* **gluwave:** hydration errors on dates ([9824dbd](https://github.com/Kalhama/Gluwave/commit/9824dbd72d958b0a254caf48e513111ed0ceb6ae))


### Reverts

* **gluwave:** carb list style ([128ac0a](https://github.com/Kalhama/Gluwave/commit/128ac0aa6c24eae65b7d9d200eedb87dc28842bf))

## [1.3.2](https://github.com/Kalhama/Gluwave/compare/gluwave-v1.3.1...gluwave-v1.3.2) (2024-10-02)


### Bug Fixes

* **gluwave:** :card_file_box: fix carbs on board performance ([7f1b4f1](https://github.com/Kalhama/Gluwave/commit/7f1b4f1b12c040625d93599b0b0c088adc2b46a7))

## [1.3.1](https://github.com/Kalhama/Gluwave/compare/gluwave-v1.3.0...gluwave-v1.3.1) (2024-10-02)


### Bug Fixes

* **gluwave:** :green_heart: Build error [#133](https://github.com/Kalhama/Gluwave/issues/133) ([d0f65c2](https://github.com/Kalhama/Gluwave/commit/d0f65c2ef1680d1b5dc8e807e7d23ec96f433a61))

## [1.3.0](https://github.com/Kalhama/Gluwave/compare/gluwave-v1.2.1...gluwave-v1.3.0) (2024-10-01)


### Features

* :sparkles: Backfill GCM data [#33](https://github.com/Kalhama/Gluwave/issues/33) ([80797a1](https://github.com/Kalhama/Gluwave/commit/80797a1c6dc484655c49544292066fcd67a95a27))
* **gluwave:** :arrow_up: make glucose trend arrow less aggressive and code more robust ([aa17e96](https://github.com/Kalhama/Gluwave/commit/aa17e9608cd867ef1982155af8b2d967baa449be))
* **gluwave:** :art: show skeleton before charts load ([0f31031](https://github.com/Kalhama/Gluwave/commit/0f31031adf28d974354341f2b19cbaab3692d400))
* **gluwave:** add top bar with glucose reading to gluocse, carbs and insulin pages ([2e51870](https://github.com/Kalhama/Gluwave/commit/2e51870f2c2ce1d3f40b70423072c83c060b342d))
* **gluwave:** change order of bottom toolbar ([e4c74bc](https://github.com/Kalhama/Gluwave/commit/e4c74bcba2a90bffda9696e53df515fbc37a778e))
* **gluwave:** top bra with glucose has a link to main page ([9bd5f19](https://github.com/Kalhama/Gluwave/commit/9bd5f1932125b917d93544d766e2beb3597a5aaf))
* refactor carbohydrates on board ([#103](https://github.com/Kalhama/Gluwave/issues/103)) ([304024c](https://github.com/Kalhama/Gluwave/commit/304024c4f21367eb60390da445488c04116f467c))


### Bug Fixes

* **gluwave:** :bug: login button not always working ([5ae62ed](https://github.com/Kalhama/Gluwave/commit/5ae62ed1d61d0ef63731b001448a3dcaa1eaa104))
* **gluwave:** hide glucose from html title if data is stale ([564e967](https://github.com/Kalhama/Gluwave/commit/564e967e0873ee9ac73f8f999889486078a798f9))
* **gluwave:** top bar not visible if there are no glucose readings ([1bf5061](https://github.com/Kalhama/Gluwave/commit/1bf50611a206e4d4026c95b64874ae9d5a012f0c))

## [1.2.1](https://github.com/Kalhama/Gluwave/compare/gluwave-v1.2.0...gluwave-v1.2.1) (2024-09-23)


### Bug Fixes

* **gluwave:** :ambulance: carbs list crash ([d5f840c](https://github.com/Kalhama/Gluwave/commit/d5f840c6089ef4e9b2e50381a0cac0007e7e4f36))
* **gluwave:** :ambulance: glucose value offset ([2ec2edc](https://github.com/Kalhama/Gluwave/commit/2ec2edcc9b67dc7e00ed6c8cdd2bc351de59e927))

## [1.2.0](https://github.com/Kalhama/Gluwave/compare/gluwave-v1.1.0...gluwave-v1.2.0) (2024-09-23)


### Features

* **gluwave:** :lipstick: Main page: Improve data visualisation styles [#92](https://github.com/Kalhama/Gluwave/issues/92) ([0f8c217](https://github.com/Kalhama/Gluwave/commit/0f8c217b2ae406a52c179e9dc92d4850997020da))
* **gluwave:** :lipstick: no entries messages ([c9a1f45](https://github.com/Kalhama/Gluwave/commit/c9a1f45af5fc77bab84225d0e5501d785598eacc))
* **gluwave:** :lipstick: Rework carbs graph [#75](https://github.com/Kalhama/Gluwave/issues/75) ([1e3864f](https://github.com/Kalhama/Gluwave/commit/1e3864f38362756539e7148efee723a5d24ff311))
* **gluwave:** :sparkles: delete entry alert dialog ([757f67f](https://github.com/Kalhama/Gluwave/commit/757f67fb0c2b865234f4426bbdd589ff0f18b735))
* **gluwave:** :sparkles: Tooltip to glucose bar telling how long ago the reading was ([c9f7cac](https://github.com/Kalhama/Gluwave/commit/c9f7cacab4788f7ae9f2065ac800c947dbaba66b))
* **gluwave:** :sparkles: view predictions in separate, more detailed view ([#76](https://github.com/Kalhama/Gluwave/issues/76)) ([4604d9e](https://github.com/Kalhama/Gluwave/commit/4604d9eb6a2bfdfa58ef3ec9b3673b3f51c64d6f))
* **gluwave:** date picker bar ([f01fb72](https://github.com/Kalhama/Gluwave/commit/f01fb724d0eacdac391f4b9123020febbcc3fb91))


### Bug Fixes

* **gluwave:** :bug: page-date-picker sohuld use local date [#93](https://github.com/Kalhama/Gluwave/issues/93) ([705d203](https://github.com/Kalhama/Gluwave/commit/705d203f65ad6c3e74482b2c2cac6a7680d5735f))
* **gluwave:** :zap: Victory hydration error [#18](https://github.com/Kalhama/Gluwave/issues/18) ([a23ee09](https://github.com/Kalhama/Gluwave/commit/a23ee09ddd5545aa3114cb3cfa5f95be335437b2))

## [1.1.0](https://github.com/Kalhama/Gluwave/compare/gluwave-v1.0.0...gluwave-v1.1.0) (2024-09-22)


### Features

* **gluwave:** :lipstick: beautify secondary views ([56d0f6b](https://github.com/Kalhama/Gluwave/commit/56d0f6b0449b16672d4ae551ea839dedcf019b12))
* **gluwave:** :lipstick: More front page beautification ([6a4e25a](https://github.com/Kalhama/Gluwave/commit/6a4e25a6947e8cbcd6e898a266e540634d729116))
* **gluwave:** burger menu ([5c09605](https://github.com/Kalhama/Gluwave/commit/5c0960513e3b853d3f752a0803e834e3a8eb04e2))
* **gluwave:** make settings less ugly ([6521ca7](https://github.com/Kalhama/Gluwave/commit/6521ca7d71b7b6733352392e8eb1d1b8d59aa628))
* **gluwave:** refactor and refresh main page css ([4421e28](https://github.com/Kalhama/Gluwave/commit/4421e28879d19ffecc6bf3c69211bac49950c588))


### Bug Fixes

* **gluwave:** :lipstick: icons ([2195077](https://github.com/Kalhama/Gluwave/commit/219507725bd18d84efbb5160c881715e4f6aee49))

## 1.0.0 (2024-09-20)

### Features

- First major version
