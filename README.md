# kuromoji-js-dictionary

kuromoji.js用の辞書ファイルを生成するスクリプト

### 準備


Git LFS/xzのインストール

```
brew install git-lfs
brew install nkf
brew install xz
```

```
https://drive.google.com/uc?export=download&id=0B4y35FiV1wh7MWVlSDBCSXZMTXM
```

### 辞書作成

```
npm start
```

または

```
node index.js
```

### 基本辞書データ

http://taku910.github.io/mecab/

### 追加データ

mecab-ipadic-neologd（https://github.com/neologd/mecab-ipadic-neologd）

次の辞書データのみプリセット
```
mecab-user-dict-seed.20180322.csv.tar.gz
neologd-adjective-verb-dict-seed.20160324.csv.tar.gz
neologd-common-noun-ortho-variant-dict-seed.20170228.csv.tar.gz
neologd-noun-sahen-conn-ortho-variant-dict-seed.20160323.csv.tar.gz
```
