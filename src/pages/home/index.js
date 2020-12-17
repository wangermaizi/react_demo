/*

 * 登录进来的首页，创建房间、加入房间的页面
 * 注：
 */
import React, { Component } from "react";
import { observer } from "mobx-react";

import { Button, Row, Col, Input } from "../../component";

import { Toast, Storage, Page, Valid, CheckBroswer } from "../../util";

import EXT_ROOM from '../../ext/room'
import EXT_NIM from '../../ext/nim'

import { StoreNim, StoreChatroom, StoreNetcall } from "../../store";

import Header from "../../component/layout/header";

const NimState = StoreNim.state;
const NimAction = StoreNim;
const ChatroomState = StoreChatroom.state;
const ChatroomAction = StoreChatroom;
const NetcallAction = StoreNetcall;
const NetcallState = StoreNetcall.state;

@observer
export default class Home extends Component {
  state = {
    roomName: "",
    roomId: "",
    showRoomNameTip: false,
    showRoomIdTip: false,
    roomNameErrorMsg: "", //创建房间错误提示
    roomIdErrorMsg: "", //加入房间错误提示
    canCreate: false,
    canJoin: false,
    createLoading: false,
    joinLoading: false,
    selectRoomInfo: {
      "index": -1
    }
  };

  componentDidMount() {
    CheckBroswer({
      success: this.autoLogin.bind(this)
    });
  }

  autoLogin() {

    if (NimState.nim) {
      console.log("已经登陆过");
      EXT_ROOM.getClassRoomList();
      return;
    }

    console.log("home:开始自动登录nim过程...");

    const account = Storage.get("account");
    const token = Storage.get("token");
    if (!account || !token) {
      console.error("home:自动登录nim:缺少account或token");
      Page.to("login");
      return;
    }

    EXT_NIM.login(account, token)
      .then(() => {
        Storage.set('account', account);
        Storage.set('token', token);
        EXT_ROOM.getClassRoomList();
      })
      .catch(err => {
        console.log(err);
        Page.to("login");
      });
  }

  autoLoginChatroom() {

    console.log("home:开始自动登录chatroom过程...");

    //步骤2：聊天室登录
    const roomId = Storage.get("roomId");
    if (!roomId) {
      console.error("home:自动登录chatroom失败：缺少roomid");
      this.roomIdInput.focus();
      return;
    }

    this.setState({
      showRoomIdTip: false,
      roomIdErrorMsg: "",
      joinLoading: true
    });


  }
  changeRoomName = e => {
    const roomName = e.target.value;
    if (Valid.isBlank(roomName)) {
      this.setState({
        roomName: "",
        canCreate: false
      });
      return;
    }

    this.setState({
      roomName: roomName.trim(),
      canCreate: true
    });
  };

  changeRoomId = e => {
    const roomId = e.target.value;
    if (Valid.isBlank(roomId)) {
      this.setState({
        roomId: "",
        canJoin: false
      });
      return;
    }

    this.setState({
      roomId: roomId.trim(),
      canJoin: true
    });
  };

  selectRoom = index => {
    this.setState({
      selectRoomInfo: {
        "index": index,
        "info": ChatroomState.rooms[index]
      },
      roomId: ChatroomState.rooms[index]["name"],
      canJoin: true
    });
  }

  preHandleRedirect() {
    //检测当前机器的可用设备
    console.log("检测当前机器的可用设备....");


    Page.to("main");
  }

  createRoom = e => {
    console.log("submit createRoom");

    if (!this.state.canCreate || this.state.createLoading) {
      console.log("不可创建或正在创建中...");
      return;
    }

    if (Valid.isBlank(this.state.roomName)) {
      this.setState({
        showRoomNameTip: true,
        roomNameErrorMsg: "房间名称不能为空"
      });
      return;
    }

    this.setState({
      showRoomNameTip: false,
      roomNameErrorMsg: "",
      createLoading: true
    });

    const account = Storage.get("account");
    const that = this;
    console.log(account);
    console.log(this.state.roomName);
    EXT_ROOM.createRoom({ "name": this.state.roomName }, account)
      .then(id => {
        Storage.set("teacherAccount", NimState.account);
        Storage.set("roomId", id);
        Storage.set("isTeacher", 1);
        Storage.set("hasPermission", true);
        Page.to("main");
      })
      .catch(err => {
        console.log(err);
        console.log("如果当前使用的是IP, 则必须使用https协议才能获取到 getUserMedia");
        that.setState({
          showRoomNameTip: true,
          roomNameErrorMsg: err,
          createLoading: false
        });
      });
  };

  joinRoom = e => {
    console.log("submit joinRoom");

    if (!this.state.canJoin || this.state.joinLoading) {
      console.log("不可加入或正在加入中...");
      return;
    }

    if (this.state.selectRoomInfo["index"] === -1) {
      this.setState({
        showRoomIdTip: true,
        roomIdErrorMsg: "请选择一个房间"
      });
      return;
    }

    this.setState({
      showRoomIdTip: false,
      roomIdErrorMsg: "",
      joinLoading: true
    });

    const account = Storage.get("account");
    const that = this;

    EXT_ROOM.joinRoom(this.state.selectRoomInfo["info"], account)
      .then(() => {
        Storage.set("roomId", this.state.roomId);
        Storage.set("isTeacher", 0);
        Page.to("main");
      })
      .catch(err => {
        console.log(err);

        that.setState({
          showRoomIdTip: true,
          roomIdErrorMsg: err,
          joinLoading: false
        });
      });

  };

  render() {
    console.log("render home");
    const state = this.state;
    return (
      <div>
        <Header isHome={true} />
        <div className="m-home">
          <div className="part part-1">
            <div className="icon icon-createroom" />
            <div className="item item-1 f-tac">
              <Input
                placeholder="请输入房间名称"
                value={state.roomName}
                onChange={this.changeRoomName}
                domRef={input => {
                  this.roomNameInput = input;
                }}
              />
            </div>
            <div className="errortip " hidden={!state.showRoomNameTip}>
              {state.roomNameErrorMsg}
            </div>
            <div className="item item-2  f-tac">
              <Button
                className="u-btn-longer"
                onClick={this.createRoom}
                loading={state.createLoading}
                disabled={!state.canCreate}
              >
                创建房间
              </Button>
            </div>
          </div>
          <div className="part part-2">
            <div className="icon icon-joinroom">
              <Row >
                <Col className="m-list-item" span={1}>房间列表</Col>
              </Row>
              {ChatroomState.rooms.map(
                (item, index) => (
                  <Row key={index}>
                    <Col className="m-list-item m-list-item2" span={1} onClick={this.selectRoom.bind(this, index)}>{item.name}</Col>
                  </Row>
                ))}
            </div>
            <div className="item item-1 f-tac">
              <Input
                disabled={true}
                name="roomId"
                placeholder="请选择房间"
                value={state.roomId}
                domRef={input => {
                  this.roomIdInput = input;
                }}
              />
            </div>
            <div className="errortip " hidden={!state.showRoomIdTip}>
              {state.roomIdErrorMsg}
            </div>
            <div className="item item-2  f-tac">
              <Button
                className="u-btn-longer"
                onClick={this.joinRoom}
                loading={state.joinLoading}
                disabled={!state.canJoin}
              >
                加入房间
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
