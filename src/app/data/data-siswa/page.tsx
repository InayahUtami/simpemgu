"use client";

import UserMasterDataTable from "../components/UserMasterDataTable";

export default function DataSiswaUserPage() {
	return (
		<UserMasterDataTable
			title="Data Siswa"
			description="Data siswa per kecamatan berdasarkan data yang sama dengan halaman admin."
			endpoint="/api/data/siswa-per-kecamatan"
			valueKey="total_siswa"
			valueLabel="Total Siswa"
		/>
	);
}
