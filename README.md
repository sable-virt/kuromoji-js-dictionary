# [WIP]kuromoji-js-dictionary

kuromoji.js用の辞書ファイルを生成するスクリプト
mecab-ipadic-neologdの汎用辞書のみプリセットで含んでます。

## 組み込まれている辞書について

基本の辞書としてmecab用のIPA辞書を使用しています。

[IPA辞書](http://taku910.github.io/mecab/#download) -> dict/mecab-ipadic-2.7.0-20070801.tar.gz

より多くの固有名詞に対応するため、[mecab-ipadic-nelogd](https://github.com/neologd/mecab-ipadic-neologd)の中から次の辞書ファイルを使用しています。

- mecab-user-dict-seed.20180322.csv.xz
- neologd-adjective-verb-dict-seed.20160324.csv.xz
- neologd-common-noun-ortho-variant-dict-seed.20170228.csv.xz
- neologd-noun-sahen-conn-ortho-variant-dict-seed.20160323.csv.xz

## 準備

GitLFS/xz/nkfのインストール

```
brew install git-lfs
brew install xz
```

### 辞書作成

```
./bin/run [options]
```

※ 同梱辞書セットはdictディレクトリに格納済みなので上記コマンドで辞書が生成されます。

## mecab-ipadic-nelogdの他の辞書を追加する

1. ./neologd-seedディレクトリに****.csv.xzを置く
2. `npm run convert` を実行
3. エラーがなければ dict/neologdディレクトリに****.tar.gzが作成されます
4. 辞書作成を実行する

## カスタム辞書の追加

1. 任意のフォルダに評価済みの辞書データをtar.gzで設置
2. `node index.js -c=/path/to/dict` のようにCオプションにオリジナルの辞書データのあるディレクトリを引き渡します

## mecab-ipadic-neologdを使用しない場合

`./bin/run -n`
