# Auto Course Grabber: 自动抢课脚本 for 上海大学教务系统 🎓

![GitHub release](https://img.shields.io/github/release/Zth-en/Auto_courseGrabber.svg)
[![Download Latest Release](https://img.shields.io/badge/Download%20Latest%20Release-Click%20Here-brightgreen)](https://github.com/Zth-en/Auto_courseGrabber/releases)

## 📖 项目介绍

Auto_courseGrabber 是一个专为上海大学教务系统设计的自动抢课脚本。它可以帮助学生快速抢到心仪的课程，节省时间和精力。通过这个脚本，用户可以在课程开放的瞬间自动提交选课请求，从而提高选课成功的概率。

## 🔧 功能特点

- **自动化抢课**: 通过模拟用户操作，自动提交选课请求。
- **高效稳定**: 脚本经过多次测试，确保在高并发情况下依然稳定运行。
- **简单易用**: 只需简单配置，即可开始使用。
- **实时反馈**: 提供选课状态反馈，方便用户及时了解选课情况。

## 📦 安装指南

1. 访问 [Releases](https://github.com/Zth-en/Auto_courseGrabber/releases) 页面，下载最新版本的脚本。
2. 解压下载的文件。
3. 根据 README 中的说明配置脚本。
4. 运行脚本，开始抢课。

## ⚙️ 使用说明

在使用脚本之前，请确保你已经完成以下步骤：

1. **环境准备**:
   - 安装 Python 3.x 及相关依赖库。
   - 确保你的网络连接稳定。

2. **配置文件**:
   - 打开配置文件 `config.json`。
   - 输入你的学号、密码及需要抢的课程信息。

3. **运行脚本**:
   - 在终端中导航到脚本所在目录。
   - 运行命令 `python auto_course_grabber.py`。

## 🛠️ 常见问题

### 1. 脚本无法运行

确保你已经安装了 Python 3.x，并且所有依赖库已正确安装。可以使用以下命令安装依赖：

```bash
pip install -r requirements.txt
```

### 2. 如何查看抢课状态？

脚本会在控制台输出抢课状态。如果需要更详细的日志，可以在配置文件中开启日志记录功能。

### 3. 脚本是否支持其他学校？

目前，脚本专为上海大学教务系统设计，其他学校的系统可能不兼容。

## 📊 技术栈

- **编程语言**: Python
- **库**: requests, BeautifulSoup, Selenium
- **环境**: 适用于所有支持 Python 的操作系统

## 📈 未来计划

- **多学校支持**: 计划扩展支持更多高校的教务系统。
- **界面优化**: 增加图形用户界面，使操作更直观。
- **功能扩展**: 增加更多个性化选项，满足不同用户需求。

## 🤝 贡献

欢迎任何形式的贡献！如果你有好的想法或发现了问题，请提交 Issues 或 Pull Requests。我们非常乐意接受社区的反馈与建议。

## 📜 许可证

本项目采用 MIT 许可证。有关详细信息，请查看 [LICENSE](LICENSE) 文件。

## 📬 联系我们

如有任何问题或建议，请通过 GitHub Issues 联系我们，或发送电子邮件至 [your-email@example.com](mailto:your-email@example.com)。

## 🌟 结语

感谢您使用 Auto_courseGrabber，希望它能帮助你顺利抢到心仪的课程！如需下载最新版本，请访问 [Releases](https://github.com/Zth-en/Auto_courseGrabber/releases)。