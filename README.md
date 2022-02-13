# redictionary

> Linux - 中英、文言文离线字典

[![Build Status](https://travis-ci.com/planetoryd/redictionary.svg?branch=main)](https://travis-ci.com/planetoryd/redictionary)

- [x] Mdict(mdx) format
- [x] Open by shortcut, by default is `Ctrl+Alt+C`
- [x] Auto-detect clipboard


```bash
sudo apt install xsel # Required to use auto-detect clipboard
```

```bash
sudo dpkg -i <pkg>
sudo chmod +x /opt/redictionary/resources/app.asar.unpacked/node_modules/clipboard-event/platform/*
```

The dictionary hides when minimizes, and it will be shown when necessary.

#### Build Setup

``` bash
# install dependencies
yarn

# serve with hot reload at localhost:9080
yarn run dev

# build electron application for production
yarn run build
```

#### What for

There are many dictionaries, but an opensource and offline dictionary that is for linux didn't exist. The dictionaries embeded are personally collected by me, which I hope will be replaced by creative-common ones.


