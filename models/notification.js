class Notification {
  constructor({ NotificationID, Content, Type, Status, AccID }) {
    this.NotificationID = NotificationID;
    this.Content = Content;
    this.Type = Type;
    this.Status = Status;
    this.AccID = AccID;
  }
}

module.exports = Notification;

