import ApiService from './apiService';

class ServerService {
  static async changePlan(serverId, planId) {
    return await ApiService.post(`/servers/${serverId}/change-plan`, { plan: planId });
  }

  static async reboot(serverId) {
    return await ApiService.post(`/servers/${serverId}/reboot`);
  }

  static async rebuild(serverId) {
    return await ApiService.post(`/servers/${serverId}/rebuild`);
  }

  static async resetPassword(serverId) {
    return await ApiService.post(`/servers/${serverId}/reset-password`);
  }

  static async start(serverId) {
    return await ApiService.post(`/servers/${serverId}/start`);
  }

  static async stop(serverId) {
    return await ApiService.post(`/servers/${serverId}/stop`);
  }

  static async suspend(serverId) {
    return await ApiService.post(`/servers/${serverId}/suspend`);
  }

  static async unsuspend(serverId) {
    return await ApiService.post(`/servers/${serverId}/unsuspend`);
  }

  static async getVnc(serverId) {
    return await ApiService.get(`/servers/${serverId}/vnc`);
  }

  static async getStats(serverId, type = 'cpu') {
    return await ApiService.get(`/servers/${serverId}/stats/${type}`);
  }

  static async getServerAddons(serverId) {
    return await ApiService.get(`/servers/${serverId}/server_addons`);
  }

  static async storeServerAddon(serverId, addonData) {
    return await ApiService.post(`/servers/${serverId}/server_addons`, addonData);
  }

  static async getStatus(serverId) {
    return await ApiService.get(`/servers/${serverId}/status`);
  }

  static async delete(serverId) {
    return await ApiService.delete(`/servers/${serverId}`);
  }
}

export default ServerService;
