# 第一次反馈
1. 由于Memory Board要显示的内容有点多，所以建议默认开启Memory Board不是在侧边栏打开，而是在一个新的笔记标签页的位置上打开。
## 回执
• 已按第一次反馈调整：Open Memory Board 现在默认在主编辑区的新标签页打开，不再新建到右侧栏。

  具体改动在 .obsidian/plugins/Everyday/src/main.ts:118：openMemoryBoard() 新建视图时改用
  this.app.workspace.getLeaf("tab")。如果 Memory Board 已经打开，仍会复用并激活已有视图。

  验证：npm.cmd run build 通过，main.js 已重新生成。当前未提交。
